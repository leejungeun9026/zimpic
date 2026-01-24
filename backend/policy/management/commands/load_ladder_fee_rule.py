import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import LadderFeeRule


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
  help = "policy/data/ladder_fee_rule.csv 파일로 LadderFeeRule 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/ladder_fee_rule.csv",
    )
    parser.add_argument(
      "--truncate",
      action="store_true",
      help="기존 LadderFeeRule 전체 삭제 후 삽입",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "ladder_fee_rule.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    if options["truncate"]:
      LadderFeeRule.objects.all().delete()

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {
        "ladder_truck_group",
        "floor_from",
        "floor_to",
        "base_amount",
        "is_active",
      }
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

      created, updated = 0, 0

      for line_no, row in enumerate(reader, start=2):
        ladder_truck_group = _normalize_str(row.get("ladder_truck_group"))
        floor_from = row.get("floor_from")
        floor_to = row.get("floor_to")
        base_amount = row.get("base_amount")
        is_active = _to_bool(row.get("is_active"))

        if not ladder_truck_group:
          raise ValueError(f"[line {line_no}] ladder_truck_group is empty")
        if floor_from is None:
          raise ValueError(f"[line {line_no}] floor_from is empty")
        if floor_to is None:
          raise ValueError(f"[line {line_no}] floor_to is empty")
        if base_amount is None:
          raise ValueError(f"[line {line_no}] base_amount is empty")

        obj, is_created = LadderFeeRule.objects.update_or_create(
          ladder_truck_group=ladder_truck_group,
          floor_from=int(floor_from),
          floor_to=int(floor_to),
          defaults={
            "base_amount": int(base_amount),
            "is_active": is_active,
          },
        )

        obj.full_clean()
        obj.save()

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

    self.stdout.write(self.style.SUCCESS(
      f"LadderFeeRule 로드완료. (created={created}, updated={updated})"
    ))
