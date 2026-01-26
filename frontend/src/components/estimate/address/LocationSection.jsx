import SectionHeader from "./SectionHeader";
import AddressField from "./AddressField";
import FloorCarryFields from "./FloorCarryFields";

export default function LocationSection({
  title,
  right,
  addressValue,
  addressDisabled,
  onFindAddress,
  floorValue,
  onChangeFloor,
  elevatorChecked,
  onChangeElevator,
  ladderChecked,
  onChangeLadder,
  fieldsDisabled,
  idPrefix,
  hint,
  bottomNote,
}) {
  return (
    <div className="mb-4">
      <SectionHeader title={title} right={right} />

      <div className="card p-4">
        <AddressField
          value={addressValue}
          placeholder="주소를 검색해 주세요"
          disabled={addressDisabled}
          onFindAddress={onFindAddress}
        />

        <FloorCarryFields
          idPrefix={idPrefix}
          disabled={fieldsDisabled}
          floorValue={floorValue}
          onChangeFloor={onChangeFloor}
          elevatorChecked={elevatorChecked}
          onChangeElevator={onChangeElevator}
          ladderChecked={ladderChecked}
          onChangeLadder={onChangeLadder}
          showHint={hint}
        />

        {bottomNote ? <div className="text-muted small mt-3">{bottomNote}</div> : null}
      </div>
    </div>
  );
}
