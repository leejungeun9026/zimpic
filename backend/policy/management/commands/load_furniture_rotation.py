import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import Furniture, FurnitureRotation


def _normalize_str(v):
  if v is None:
    return None
  s = str(v).strip()
  if s == "" or s.lower() in ("null", "none"):
    return None
  return s


def detect_dialect(sample: str):
  try:
    return csv.Sniffer().sniff(sample, delimiters=",\t")
  except csv.Error:
    return csv.get_dialect("excel-tab" if sample.count("\t") > sample.count(",") else "excel")


class Command(BaseCommand):
  help = "policy/data/furniture_rotation.csv 파일로 FurnitureRotation 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/furniture_rotation.csv",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    policy_dir = Path(__file__).resolve().parents[2]  # policy/
    default_path = policy_dir / "data" / "furniture_rotation.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      # CSV 끝에 쉼표 있으면 빈 컬럼명 생길 수 있음 -> 제거
      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {"name_en", "orientation_code", "note"}
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns in CSV header: {sorted(missing)}")

      created, updated = 0, 0
      missing_furniture = []

      for line_no, row in enumerate(reader, start=2):
        name_en = _normalize_str(row.get("name_en"))
        orientation_code = _normalize_str(row.get("orientation_code"))
        note = _normalize_str(row.get("note"))

        if not name_en:
          raise ValueError(f"[line {line_no}] name_en is empty")
        if not orientation_code:
          raise ValueError(f"[line {line_no}] orientation_code is empty")

        furniture = Furniture.objects.filter(name_en=name_en).first()
        if not furniture:
          missing_furniture.append((line_no, name_en))
          continue

        obj, is_created = FurnitureRotation.objects.update_or_create(
          furniture=furniture,
          orientation_code=orientation_code,
          defaults={"note": note},
        )

        created += 1 if is_created else 0
        updated += 0 if is_created else 1

      if missing_furniture:
        preview = ", ".join([f"{ln}:{ne}" for ln, ne in missing_furniture[:10]])
        raise ValueError(
          f"Rotation CSV refers to unknown furniture name_en. "
          f"Count={len(missing_furniture)} (showing up to 10: {preview})"
        )

    self.stdout.write(self.style.SUCCESS(
      f"FurnitureRotation 로드 완료. from {csv_path} (created={created}, updated={updated})"
    ))
