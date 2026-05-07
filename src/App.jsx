import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CustomToolNode from "./nodes/CustomToolNode";
import startTest from "./service/startTest"

const initialNodes = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

const nodeTypes = {
  customToolNode: CustomToolNode,
};

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [testStatus, setTestStatus] = useState("Waiting")
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  let id = 0

  const updateNodeValue = (nodeId, newValue) => {
  setNodes((nodes) =>
    nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            prev_value: newValue,
          },
        };
      }

      return node;
    })
  );
};
  
  const constructNodes = (toolsData) => {
    const resultNode = [];
    const resultEdge = [];
    let initPosX = 0;

    for (const [key, value] of Object.entries(toolsData)) {
      const idenKey = key + id
      resultNode.push({
        id: idenKey,
        position: { x: initPosX, y: 0 },
        type: "customToolNode",
        data: { label: key, input: value.run_in, output: value.run_out, update_node: updateNodeValue, id: idenKey, value: null },
      });
      resultEdge.push({
        id: key,
      });
      initPosX += 250;
      id += 1
    }

    setNodes(resultNode);
  };

  const handlePrintEdge = () => {
    console.log(edges)
  }

  const handlePrintNodeData = () => {
    nodes.forEach((node) => {
      console.log(node.data.label, node.data.prev_value)
    })
  }

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("http://127.0.0.1:8000/tools", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        console.log("yay");
        setData(json);
        constructNodes(json);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Cleanup on unmount
    return () => {
      controller.abort();
    };
  }, []);

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => {
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
    },
    [],
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
              <Panel position="top-left">
        <div className="xy-theme__button-group">
          <button
            className={`xy-theme__button ''`}
            onClick={handlePrintEdge}
          >
            Print Edge
          </button>
          <button
            className={`xy-theme__button ''`}
            onClick={handlePrintNodeData}
          >
            Print Node Data
          </button>
          <button
            className={`xy-theme__button ''`}
            onClick={() => startTest(nodes, edges, setTestStatus)}
          >
            Start Test
          </button>
          <br/><br/><pre>{testStatus}</pre>
        </div>
      </Panel>
        <Background />
      </ReactFlow>
    </div>
  );
}
