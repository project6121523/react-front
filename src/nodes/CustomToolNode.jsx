import { Handle, Position } from "@xyflow/react";

export default function CustomToolNode({ data }) {
  let inputs = data.input ?? [];
  let outputs = data.output ?? [];

  if (inputs.length === 1 && inputs[0] === "None") {
    inputs = []
  }

  if (outputs.length === 1 && outputs[0] === "None") {
    outputs = []
  }

  const getTop = (index, total) =>
    `${((index + 1) / (total + 1)) * 100}%`;

  return (
    <div
      style={{
        minWidth: 200,
        minHeight: 80,
        padding: "12px 16px",
        border: "1px solid #999",
        borderRadius: 8,
        background: "white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        position: "relative",
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: "bold" }}>{data.label}</div>

      {inputs.map((inputName, i) => {
        const top = getTop(i, inputs.length);

        return (
          <div key={`input-${i}`}>
            <Handle
              type="target"
              position={Position.Left}
              id={`input-${i}`}
              style={{ top, background: "#5745f5" }}
            />

            <span
              style={{
                position: "absolute",
                left: 8,
                top,
                transform: "translateY(-50%)",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              {inputName}
            </span>
          </div>
        );
      })}

      {outputs.map((outputName, i) => {
        const top = getTop(i, outputs.length);

        return (
          <div key={`output-${i}`}>
            <Handle
              type="source"
              position={Position.Right}
              id={`output-${i}`}
              style={{ top, background: "#45f55d" }}
            />

            <span
              style={{
                position: "absolute",
                right: 8,
                top,
                transform: "translateY(-50%)",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              {outputName}
            </span>
          </div>
        );
      })}
      <button onClick={() => data.update_node(data.id, 42)}>Open</button>
    </div>
  );
}