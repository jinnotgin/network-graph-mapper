<script>
  import { connectionsStr as _connectionsStr } from "./constants.js";
  import {
    getConnections,
    nodeMapper,
    pathFinder,
    getGraphData,
    getConnectorsAcrossNodePositions,
    svgScale
  } from "./utils.js";
  const version = 0.25;

  let connectionsStr = _connectionsStr;
  $: connections = getConnections(connectionsStr);

  let nodeMap = {};
  let paths = [];
  let matrix = [[]];
  let nodesPosition = {};
  let connectors = {};
  $: {
    connections;

    nodeMap = nodeMapper(connections);
    paths = pathFinder(nodeMap);

    const graphData = getGraphData(paths);
    matrix = graphData.matrix;
    nodesPosition = graphData.nodesPosition;
    connectors = getConnectorsAcrossNodePositions(connections, nodesPosition);

    // console.log({
    //   nodeMap,
    //   paths,
    //   matrix,
    //   nodesPosition,
    //   connectors
    // });
  }
</script>

<style>
  main {
    height: 95vh;
    padding: 0.75em;
    font-family: sans-serif;
  }
  h1 {
    margin: 0;
  }
  div.content {
    height: 100%;
    display: flex;
    align-items: center;
  }
  .inputContainer {
    height: 90%;
    display: flex;
    flex-direction: column;
  }
  #pathsInput {
    flex: 1;
    width: 6em;
    font-size: 1.5rem;
  }
  svg {
    height: 100%;
  }
  svg line,
  svg path {
    stroke: #000;
    stroke-width: 0.03;
  }
  svg path {
    fill: transparent;
  }
  svg circle {
    fill: darkblue;
  }
  svg text {
    font-size: 0.15px;
    text-anchor: middle;
    fill: white;
  }
</style>

<svelte:head>
	<title>Network Graph Mapper - Jin v{version}</title>
</svelte:head>

<main>
  <h1>Network Graph Mapper - Jin v{version}</h1>
  <div class="content">
    <div class="inputContainer">
      <span>Connections: </span>
      <textarea id="pathsInput" bind:value={connectionsStr}></textarea>
    </div>
    <svg viewbox={`0 0 ${matrix[0].length+1} ${matrix.length+1}`}>
      <defs>
        <marker id="arrowhead-straight" markerWidth="10" markerHeight="7" 
        refX="20" refY="3.5" orient="auto">
          <polygon points="0 0, 5 3.5, 0 7" />
        </marker>
        <marker id="arrowhead-curve" markerWidth="10" markerHeight="7" 
        refX="20" refY="4.5" orient="auto">
          <polygon points="0 0, 5 3.5, 0 7" />
        </marker>
      </defs>
      {#each connectors as connector, i}
        {#if (connector.type === "straight")}
            <line 
              x1={connector.x1} 
              y1={connector.y1} 
              x2={connector.x2} 
              y2={connector.y2} 
              marker-end="url(#arrowhead-straight)" 
            />
          {:else if (connector.type === "curve")}
            <path
              d={`
              M ${connector.x1} ${connector.y1} 
              Q ${connector.cx} ${connector.cy}  
              ${connector.x2} ${connector.y2}
              `}
              fill = "transparent" 
              marker-end="url(#arrowhead-curve)" 
            />
        {/if}
      {/each}

      {#each Object.entries(nodesPosition) as [node, [x,y]], i}
        <circle cx={x} cy={y} r={0.175}/>
        <text x={x} y={y+0.05}>{node}</text>
      {/each}
    </svg>
    <!--
    {#each paths as path, i}
      <p>{path.join(' -> ')}</p>
    {/each}
    -->
  </div>
</main>