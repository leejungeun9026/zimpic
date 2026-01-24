import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import Furniture, SpecialItemFee


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
  help = "policy/data/special_item_fee.csv 파일로 SpecialItemFee 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/special_item_fee.csv",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "special_item_fee.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {"name_en", "description", "unit_amount", "is_active"}
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

      created, updated = 0, 0
      missing_furniture = []

      for line_no, row in enumerate(reader, start=2):
        name_en = _normalize_str(row.get("name_en"))
        description = _normalize_str(row.get("description"))
        unit_amount = row.get("unit_amount")
        is_active = _to_bool(row.get("is_active"))

        if not name_en:
          raise ValueError(f"[line {line_no}] name_en is empty")
        if description is None:
          raise ValueError(f"[line {line_no}] description is empty")
        if unit_amount is None:
          raise ValueError(f"[line {line_no}] unit_amount is empty")

        furniture = Furniture.objects.filter(name_en=name_en).first()
        if not furniture:
          missing_furniture.append((line_no, name_en))
          continue

        obj, is_created = SpecialItemFee.objects.update_or_create(
          furniture=furniture,
          defaults={
            "description": description,
            "unit_amount": int(unit_amount),
            "is_active": is_active,
          },
        )

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

      if missing_furniture:
        preview = ", ".join([f"{ln}:{ne}" for ln, ne in missing_furniture[:10]])
        raise ValueError(
          f"SpecialItemFee CSV refers to unknown furniture name_en. "
          f"Count={len(missing_furniture)} (showing up to 10: {preview})"
        )

    self.stdout.write(self.style.SUCCESS(
      f"SpecialItemFee 로드 완료 (created={created}, updated={updated})"
    ))
