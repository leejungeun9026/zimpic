export default function SkeletonRows({ count = 4 }) {
  return (
    <div className="mt-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="mb-2 rounded"
          style={{
            height: 52,
            background: "#EEF2F7",
            border: "1px solid #E9EDF5",
          }}
        />
      ))}
    </div>
  );
}
