import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import BoxRule


def _normalize_str(v):
  if v is None:
    return None
  s = str(v).strip()
  if s == "" or s.lower() in ("null", "none"):
    return None
  return s


def _to_bool(v):
  if v is None:
    return False
  return str(v).strip().lower() in ("true", "1", "yes", "y")


def detect_dialect(sample: str):
  try:
    return csv.Sniffer().sniff(sample, delimiters=",\t")
  except csv.Error:
    return csv.get_dialect(
      "excel-tab" if sample.count("\t") > sample.count(",") else "excel"
    )


class Command(BaseCommand):
  help = "policy/data/box_rule.csv 파일로 BoxRule 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/box_rule.csv",
    )
    parser.add_argument(
      "--truncate",
      action="store_true",
      help="기존 BoxRule 전체 삭제 후 삽입",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "box_rule.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    if options["truncate"]:
      BoxRule.objects.all().delete()

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {
        "area_min_py",
        "area_max_py",
        "boxes_min",
        "boxes_max",
        "boxes_avg",
        "note",
        "is_active",
      }
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

      created, updated = 0, 0

      for line_no, row in enumerate(reader, start=2):
        area_min_py = row.get("area_min_py")
        area_max_py = row.get("area_max_py")
        boxes_min = row.get("boxes_min")
        boxes_max = row.get("boxes_max")
        boxes_avg = row.get("boxes_avg")
        note = _normalize_str(row.get("note"))
        is_active = _to_bool(row.get("is_active"))

        if area_min_py is None:
          raise ValueError(f"[line {line_no}] area_min_py is empty")
        if area_max_py is None:
          raise ValueError(f"[line {line_no}] area_max_py is empty")
        if boxes_min is None:
          raise ValueError(f"[line {line_no}] boxes_min is empty")
        if boxes_max is None:
          raise ValueError(f"[line {line_no}] boxes_max is empty")
        if boxes_avg is None:
          raise ValueError(f"[line {line_no}] boxes_avg is empty")
        if note is None:
          raise ValueError(f"[line {line_no}] note is empty")

        obj, is_created = BoxRule.objects.update_or_create(
          area_min_py=int(area_min_py),
          area_max_py=int(area_max_py),
          defaults={
            "boxes_min": int(boxes_min),
            "boxes_max": int(boxes_max),
            "boxes_avg": int(boxes_avg),
            "note": note,
            "is_active": is_active,
          },
        )

        # 모델 clean() (구간 겹침/avg 범위 등) 강제 검증
        # update_or_create는 defaults로 저장한 뒤에도 검증을 안 하므로, 여기서 한 번 더 체크
        obj.full_clean()
        obj.save()

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

    self.stdout.write(self.style.SUCCESS(
      f"BoxRule 로드 완료 (created={created}, updated={updated})"
    ))