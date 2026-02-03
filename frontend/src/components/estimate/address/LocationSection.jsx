// LocationSection.jsx
import SectionHeader from "./SectionHeader";
import AddressField from "./AddressField";
import FloorCarryFields from "./FloorCarryFields";

export default function LocationSection({
  title,
  right,
  addressValue,
  addressDisabled,
  onFindAddress,
  addressBelow, // ✅ 추가
  floorValue,
  onChangeFloor,
  elevatorChecked,
  onChangeElevator,
  ladderChecked,
  onChangeLadder,
  fieldsDisabled,
  idPrefix,
}) {
  return (
    <div className="card border-secondary border-opacity-10 rounded-4">
      <div className="card-header px-3 py-4 pb-0 bg-transparent border-0">
        <SectionHeader title={title} right={right} />
      </div>
      <div className="card-body">
        <AddressField
          title={title}
          value={addressValue}
          disabled={addressDisabled}
          onFindAddress={onFindAddress}
        />
        {addressBelow}
        <FloorCarryFields
          title={title}
          idPrefix={idPrefix}
          disabled={fieldsDisabled}
          floorValue={floorValue}
          onChangeFloor={onChangeFloor}
          elevatorChecked={elevatorChecked}
          onChangeElevator={onChangeElevator}
          ladderChecked={ladderChecked}
          onChangeLadder={onChangeLadder}
        />
      </div>
    </div>
  );
}
