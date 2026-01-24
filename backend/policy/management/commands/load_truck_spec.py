import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import TruckSpec


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
  help = "policy/data/truck_spec.csv 파일로 TruckSpec 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/truck_spec.csv",
    )
    parser.add_argument(
      "--truncate",
      action="store_true",
      help="기존 TruckSpec 전체 삭제 후 삽입",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "truck_spec.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    if options["truncate"]:
      TruckSpec.objects.all().delete()

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {
        "truck_type",
        "name",
        "body_type",
        "inner_width_cm",
        "inner_length_cm",
        "inner_height_cm",
        "cbm_geom",
        "is_active",
      }
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

      created, updated = 0, 0

      for line_no, row in enumerate(reader, start=2):
        truck_type = _normalize_str(row.get("truck_type"))
        name = _normalize_str(row.get("name"))
        body_type = _normalize_str(row.get("body_type"))

        inner_width_cm = row.get("inner_width_cm")
        inner_length_cm = row.get("inner_length_cm")
        inner_height_cm = row.get("inner_height_cm")
        cbm_geom = row.get("cbm_geom")

        is_active = _to_bool(row.get("is_active"))

        if not truck_type:
          raise ValueError(f"[line {line_no}] truck_type is empty")
        if name is None:
          raise ValueError(f"[line {line_no}] name is empty")
        if body_type is None:
          raise ValueError(f"[line {line_no}] body_type is empty")
        if inner_width_cm is None:
          raise ValueError(f"[line {line_no}] inner_width_cm is empty")
        if inner_length_cm is None:
          raise ValueError(f"[line {line_no}] inner_length_cm is empty")
        if inner_height_cm is None:
          raise ValueError(f"[line {line_no}] inner_height_cm is empty")
        if cbm_geom is None:
          raise ValueError(f"[line {line_no}] cbm_geom is empty")

        obj, is_created = TruckSpec.objects.update_or_create(
          truck_type=truck_type,
          defaults={
            "name": name,
            "body_type": body_type,
            "inner_width_cm": int(inner_width_cm),
            "inner_length_cm": int(inner_length_cm),
            "inner_height_cm": int(inner_height_cm),
            "cbm_geom": int(cbm_geom),
            "is_active": is_active,
          },
        )

        obj.full_clean()
        obj.save()

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

    self.stdout.write(self.style.SUCCESS(
      f"TruckSpec 로드완료. (created={created}, updated={updated})"
    ))
