import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.db import transaction

from policy.models import Furniture


def _normalize_str(v):
  if v is None:
    return None
  s = str(v).strip()
  if s == "" or s.lower() in ("null", "none"):
    return None
  return s


def parse_bool(v, default=False):
  s = _normalize_str(v)
  if s is None:
    return default
  s = s.lower()
  if s in ("true", "t", "1", "y", "yes"):
    return True
  if s in ("false", "f", "0", "n", "no"):
    return False
  raise ValueError(f"Invalid boolean: {v}")


def parse_int(v, *, allow_none=True):
  s = _normalize_str(v)
  if s is None:
    return None if allow_none else 0
  try:
    return int(float(s))  # "33.0" 방어
  except ValueError as e:
    raise ValueError(f"Invalid int: {v}") from e


def parse_pos_int_min1(v, *, fallback_min1=True):
  """
  PositiveIntegerField + MinValueValidator(1) 대응.
  CSV에 0이 있으면:
    - fallback_min1=True: 1로 보정(로딩 성공 우선)
    - fallback_min1=False: 에러 발생
  """
  n = parse_int(v, allow_none=False)
  if n < 1:
    if fallback_min1:
      return 1
    raise ValueError(f"Value must be >= 1, got {n}")
  return n


def parse_decimal_1(v, *, default=Decimal("0.0")):
  s = _normalize_str(v)
  if s is None:
    return default
  try:
    return Decimal(s)
  except (InvalidOperation, ValueError) as e:
    raise ValueError(f"Invalid decimal: {v}") from e


def detect_dialect(sample: str):
  # 쉼표/탭 자동 감지
  try:
    return csv.Sniffer().sniff(sample, delimiters=",\t")
  except csv.Error:
    return csv.get_dialect("excel-tab" if sample.count("\t") > sample.count(",") else "excel")


class Command(BaseCommand):
  help = "policy/data/furniture.csv 파일로 Furniture 데이터를 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--path",
      type=str,
      default=None,
      help="Optional CSV path. Default: policy/data/furniture.csv",
    )
    parser.add_argument(
      "--strict-dimensions",
      action="store_true",
      help="If set, width/depth/height < 1 will raise error instead of falling back to 1.",
    )

  @transaction.atomic
  def handle(self, *args, **options):
    strict_dimensions = options["strict_dimensions"]

    # policy/management/commands/ -> policy/
    policy_dir = Path(__file__).resolve().parents[2]
    default_path = policy_dir / "data" / "furniture.csv"
    csv_path = Path(options["path"]) if options["path"] else default_path

    if not csv_path.exists():
      raise FileNotFoundError(f"CSV not found: {csv_path}")

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
      sample = f.read(4096)
      f.seek(0)
      dialect = detect_dialect(sample)
      reader = csv.DictReader(f, dialect=dialect)

      # CSV 끝에 쉼표가 있으면 빈 컬럼명이 들어올 수 있음 -> 제거
      if reader.fieldnames:
        reader.fieldnames = [fn for fn in reader.fieldnames if fn and fn.strip()]

      required = {
        "name_kr", "name_en", "yolo_id", "category",
        "description", "reference_model", "reference_url",
        "width_cm", "depth_cm", "height_cm", "padding_cm",
        "needs_disassembly", "stackable", "can_stack_on_top",
      }
      missing = required - set(reader.fieldnames or [])
      if missing:
        raise ValueError(f"Missing required columns in CSV header: {sorted(missing)}")

      created = 0
      updated = 0

      for line_no, row in enumerate(reader, start=2):  # header=1
        try:
          name_en = _normalize_str(row.get("name_en"))
          if not name_en:
            raise ValueError("name_en is empty")

          defaults = {
            "name_kr": _normalize_str(row.get("name_kr")) or "",
            "category": _normalize_str(row.get("category")) or "",
            "yolo_id": parse_int(row.get("yolo_id"), allow_none=True),

            "description": _normalize_str(row.get("description")),
            "reference_model": _normalize_str(row.get("reference_model")),
            "reference_url": _normalize_str(row.get("reference_url")),

            "width_cm": parse_pos_int_min1(
              row.get("width_cm"),
              fallback_min1=not strict_dimensions
            ),
            "depth_cm": parse_pos_int_min1(
              row.get("depth_cm"),
              fallback_min1=not strict_dimensions
            ),
            "height_cm": parse_pos_int_min1(
              row.get("height_cm"),
              fallback_min1=not strict_dimensions
            ),

            "padding_cm": parse_decimal_1(row.get("padding_cm"), default=Decimal("0.0")),

            "needs_disassembly": parse_bool(row.get("needs_disassembly"), default=False),
            "stackable": parse_bool(row.get("stackable"), default=False),
            "can_stack_on_top": parse_bool(row.get("can_stack_on_top"), default=False),
          }

          obj, is_created = Furniture.objects.update_or_create(
            name_en=name_en,
            defaults=defaults,
          )

          # validators까지 확실히 체크
          try:
            obj.full_clean()
          except ValidationError as ve:
            raise ValueError(f"ValidationError: {ve.message_dict}") from ve

          created += 1 if is_created else 0
          updated += 0 if is_created else 1

        except Exception as e:
          raise ValueError(f"[{csv_path.name} line {line_no}] {e}")

    self.stdout.write(self.style.SUCCESS(
      f"Furniture 로드 완료. from {csv_path} (created={created}, updated={updated})"
    ))
