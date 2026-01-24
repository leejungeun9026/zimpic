from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction


class Command(BaseCommand):
  help = "policy의 모든 정책 CSV를 순서대로 로드합니다."

  def add_arguments(self, parser):
    parser.add_argument(
      "--truncate",
      action="store_true",
      help="각 로더 커맨드에 --truncate를 전달합니다(해당 커맨드가 지원하는 경우).",
    )
    parser.add_argument(
      "--no-transaction",
      action="store_true",
      help="전체를 하나의 트랜잭션으로 묶지 않고 실행합니다.",
    )

  def handle(self, *args, **options):
    truncate = options["truncate"]
    use_tx = not options["no_transaction"]

    ordered_commands = [
      ("policy_furniture", "load_furniture"),
      ("policy_furniturerotation", "load_furniture_rotation"),
      ("policy_boxrule", "load_box_rule"),
      ("policy_truckspec", "load_truck_spec"),
      ("policy_baseprice", "load_base_price"),
      ("policy_ladderfeerule", "load_ladder_fee_rule"),
      ("policy_stairsfeerule", "load_stairs_fee_rule"),
      ("policy_distancefeerule", "load_distance_fee_rule"),
      ("policy_specialitemfee", "load_special_item_fee"),
    ]

    def _run_all():
      for title, cmd in ordered_commands:
        self.stdout.write(self.style.MIGRATE_HEADING(f"\n▶ {title}"))
        if truncate:
          # 각 커맨드가 --truncate를 지원하는 경우에만 정상 동작
          call_command(cmd, "--truncate")
        else:
          call_command(cmd)

    if use_tx:
      with transaction.atomic():
        _run_all()
    else:
      _run_all()

    self.stdout.write(self.style.SUCCESS("\nAll policy data 로드 성공"))
