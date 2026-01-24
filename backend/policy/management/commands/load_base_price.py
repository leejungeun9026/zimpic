import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import BasePrice


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
  help = "policy/data/base_price.csv 파일로 BasePrice 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/base_price.csv",
    )
    parser.add_argument(
      "--truncate",
      action="store_true",
      help="기존 BasePrice 전체 삭제 후 삽입",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "base_price.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    if options["truncate"]:
      BasePrice.objects.all().delete()

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {
        "move_type",
        "truck_type",
        "base_amount",
        "included_workers",
        "note",
        "is_active",
      }
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

      created, updated = 0, 0

      for line_no, row in enumerate(reader, start=2):
        move_type = _normalize_str(row.get("move_type"))
        truck_type = _normalize_str(row.get("truck_type"))
        base_amount = row.get("base_amount")
        included_workers = row.get("included_workers")
        note = _normalize_str(row.get("note")) or ""
        is_active = _to_bool(row.get("is_active"))

        if not move_type:
          raise ValueError(f"[line {line_no}] move_type is empty")
        if not truck_type:
          raise ValueError(f"[line {line_no}] truck_type is empty")
        if base_amount is None:
          raise ValueError(f"[line {line_no}] base_amount is empty")
        if included_workers is None:
          raise ValueError(f"[line {line_no}] included_workers is empty")

        obj, is_created = BasePrice.objects.update_or_create(
          move_type=move_type,
          truck_type=truck_type,
          defaults={
            "base_amount": int(base_amount),
            "included_workers": int(included_workers),
            "note": note,
            "is_active": is_active,
          },
        )

        obj.full_clean()
        obj.save()

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

    self.stdout.write(self.style.SUCCESS(
      f"BasePrice 로드완료. (created={created}, updated={updated})"
    ))
