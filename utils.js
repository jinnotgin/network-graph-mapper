export const getConnections = (connectionsStr) => {
  const lines = connectionsStr.toUpperCase().trim().split("\n");

  const pairs = [];
  for (let line of lines) {
    const nodes = line.split(",");

    for (let i = 0; i < nodes.length - 1; i++) {
      pairs.push([nodes[i], nodes[i + 1]]);
    }
  }
  return pairs;
};

// NODE MAPPER
export const nodeMapper = (connections) => {
  const output = {};
  for (let connection of connections) {
    let [from = undefined, to = undefined] = connection;
    if (from === undefined || to === undefined) continue;

    from = from.trim();
    to = to.trim();

    if (!(from in output)) output[from] = [];
    if (!(to in output)) output[to] = [];

    if (!output[from].includes(to)) output[from].push(to);
  }
  return output;
};

// PATH FINDER
export const pathFinder = (nodeMap) => {
  const memo = {};
  const pathTracer = (node, startingNode = undefined, recurssionCount = 0) => {
    try {
      // recursion count check #1: recursion count
      if (recurssionCount > Object.keys(nodeMap).length) {
        console.log(
          "circular dependency detected: recursion count exceeds available nodes",
          node
        );
        return [];
      }

      // circular dependecy check #2: same node
      if (startingNode && node === startingNode) {
        console.log("circular dependency detected: for", node);
        return [];
      }

      // if first time path tracing, set startingNode
      if (startingNode === undefined) startingNode = node;

      // if path result is in memo, use it
      if (node in memo) {
        memo[node].useCount += 1;
        return memo[node].result;
      }

      // if not, trace the path result
      const nextNodes = nodeMap[node];
      const output = [];
      if (nextNodes.length === 0) {
        output.push([node]);
      } else {
        for (let nextNode of nextNodes) {
          const innerPaths = pathTracer(
            nextNode,
            startingNode,
            recurssionCount++
          );

          for (let pathArray of innerPaths) {
            output.push([node, ...pathArray]);
          }
        }
      }

      // add path result to memo
      memo[node] = {
        result: output,
        useCount: 0
      };

      return output;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // trace path across all nodes
  for (let node of Object.keys(nodeMap)) {
    pathTracer(node);
  }

  // from memonization, find out which nodes are not used
  // these will be the nodes with the longest paths
  const output = [];
  for (let nodeMemoData of Object.values(memo)) {
    if (nodeMemoData.useCount > 0) continue;

    for (let path of nodeMemoData.result) {
      output.push(path);
    }
  }

  // sort by length, longest shown first
  output.sort((a, b) => b.length - a.length);
  return output;
};

// generate graphData from paths
export const getGraphData = (paths) => {
  // clone the array
  const pathsC = [...paths];

  // form the middle row, which is the first / longest path
  const middle = pathsC.length > 0 ? pathsC.shift() : [];

  // track which nodes are plotted already
  const nodesPlotted = [];
  for (let i = 0; i < middle.length; i++) {
    const node = middle[i];
    nodesPlotted.push(node);
  }

  // create diff arrays to track bottom and top of the middle row
  const top = [];
  const bottom = [];
  const emptyRow = () => Array(middle.length).fill(undefined);
  const expand = (node = undefined, i = undefined) => {
    top.push(emptyRow());
    bottom.push(emptyRow());

    if (node !== undefined && i !== undefined) {
      const depth = bottom.length - 1;
      bottom[depth][i] = node;
    }
  };
  expand();

  // function to plot nodes on to either bottom or top
  const plotNode = (node, i) => {
    const findGap = (stack, i) => {
      for (let d = 0; d < stack.length; d++) {
        if (stack[d][i] === undefined) return d;
      }
      return -1;
    };
    let bottomGap = findGap(bottom, i);
    let topGap = findGap(top, i);

    if (bottomGap === -1 && topGap === -1) {
      expand(node, i);
    } else if (topGap > bottomGap) {
      // bottomGap === -1 aka taken
      top[topGap][i] = node;
    } else {
      bottom[bottomGap][i] = node;
    }
    nodesPlotted.push(node);
  };

  // plot the nodes for the remaining paths
  for (let path of pathsC) {
    for (let i = 0; i < path.length; i++) {
      const node = path[i];

      if (nodesPlotted.includes(node)) continue;
      plotNode(node, i);
    }
  }

  // generate the matrix for middle & bottom
  const matrix = [middle, ...bottom];
  // then add the top rows
  for (let i = 0; i < top.length; i++) {
    const row = top[i];

    // for the last line - check if all is undefined. if so, ignore
    if (
      i === top.length - 1 &&
      row.filter((x) => x === undefined).length === row.length
    )
      continue;

    matrix.unshift(row);
  }

  // map out locations of each node in matrix
  const nodesPosition = {};
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      const node = row[x];
      if (node === undefined) continue;
      nodesPosition[node] = [x + 1, y + 1];
    }
  }
  return { matrix, nodesPosition };
};

export const getConnectorsAcrossNodePositions = (
  connections,
  nodesPosition
) => {
  const connectors = [];

  for (let [nodeA, nodeB] of connections) {
    if (!!!nodesPosition[nodeA] || !!!nodesPosition[nodeB]) continue;

    const pos = {
      x1: nodesPosition[nodeA][0],
      y1: nodesPosition[nodeA][1],
      x2: nodesPosition[nodeB][0],
      y2: nodesPosition[nodeB][1]
    };
    // horziontal collision
    const isSameY = pos.y1 === pos.y2;
    const isHorizontalCollision = isSameY && Math.abs(pos.x1 - pos.x2) > 1;

    // vertical collision
    // note: unlikely to happen given current nodePlot algorithm
    const isSameX = pos.x1 === pos.x2;
    const isVerticalCollision = isSameX && Math.abs(pos.y1 - pos.y2) > 1;

    // quarter (45 degrees) collision
    const xDiff = pos.x2 - pos.x1;
    const yDiff = pos.y2 - pos.y1;
    const isQuarter = Math.abs(xDiff) === Math.abs(yDiff);
    const isQuarterCollision = isQuarter && Math.abs(xDiff) > 1;

    const output = { ...pos };
    if (isHorizontalCollision || isVerticalCollision || isQuarterCollision) {
      console.log("line collision detected between", nodeA, nodeB);
      output.type = "curve";
      output.cx = (output.x2 + output.x1) / 2;
      output.cy =
        (output.y1 === output.y2 ? output.y1 : (output.y2 + output.y1) / 2) *
        1.25;
    } else {
      output.type = "straight";
    }
    connectors.push(output);
  }

  return connectors;
};
