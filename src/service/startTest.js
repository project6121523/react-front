function buildExecutionGraph(nodes, edges) {
  const graph = {};

  for (const node of nodes) {
    graph[node.id] = {
      id: node.id,
      label: node.data.label,
      inputTypes: node.data.input ?? [],
      outputTypes: node.data.output ?? [],
      value: node.data.value ?? null,
      prev_value: node.data.prev_value ?? null,
      dependsOn: [],
      sendsTo: [],
    };
  }

  for (const edge of edges) {
    const source = edge.source;
    const target = edge.target;

    graph[source].sendsTo.push(target);
    graph[target].dependsOn.push(source);
  }

  return graph;
}


function buildExecutionOrder(nodes, edges) {
  const graph = buildExecutionGraph(nodes, edges);

  const visited = new Set();
  const visiting = new Set();
  const order = [];

  function visit(nodeId, setTestStatus) {
    if (visiting.has(nodeId)) {
      throw new Error("Cycle detected in graph");
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);

    for (const dependency of graph[nodeId].dependsOn) {
      visit(dependency);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  }

  for (const nodeId of Object.keys(graph)) {
    visit(nodeId);
  }

  return order;
}

function checkDepends(graph, setTestStatus) {
    for (const [key, value] of Object.entries(graph)) {
        if (value.dependsOn.length != value.inputTypes.length) {
        setTestStatus(`${value.label} is missing dependencies`)
        return false
    }
    }
    return true
}

const sendData = async (tool, value, setTestStatus) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/test_tool", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tool: tool,
        value: value,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    setTestStatus((status) => status + `${data.tool} status: ${data.status} result: ${data.result}\n`);

    return data.result
  } catch (error) {
    console.error("POST request failed:", error);
  }
};

function get_prev_values(graph, current) {
    function get_value(graph_node_id) {
        return graph[graph_node_id].value
    }
    current.dependsOn.forEach((depends) => {
        if (!current.prev_value) {
            current.prev_value = [get_value(depends)]
        } else {
            current.prev_value.push(get_value(depends))
        }
    })
}


export default async function StartTest(nodes, edges, setTestStatus) {
    const graph = buildExecutionGraph(nodes,edges)
    const exec_order = buildExecutionOrder(nodes,edges)
    if (!checkDepends(graph, setTestStatus)) {
        return
    }
    setTestStatus("")
    for (let i = 0; i < exec_order.length; i ++) {
        get_prev_values(graph, graph[exec_order[i]])
        const new_value = await sendData(graph[exec_order[i]].label, graph[exec_order[i]].prev_value ??= null, setTestStatus)
        graph[exec_order[i]].value = new_value
    }
    console.log(graph)
}