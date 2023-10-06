// script.js
function generateScript() {
  // Get user inputs for WAN count and source address
  const wanCount = +document.getElementById('wanCount').value;
  const sourceAddress = document.getElementById('sourceAddress').value;

  // Validate WAN count input
  if (isNaN(wanCount) || wanCount < 1 || wanCount > 246) {
    alert('Please enter a valid number of WAN Connections (1-246).');
    return;
  }

  // Initialize the script string
  let script = '';

  // Function to add input rule
  function addInputRule(comment) {
    script += '/ip firewall mangle\n';
    script += ':for i from=1 to=' + wanCount + ' do={\n';
    script += 'add comment=' + comment + ' chain=input in-interface=("WAN$i") action=mark-connection new-connection-mark=("WAN$i_conn")}\n\n';
  }

  // Function to add output rule
  function addOutputRule(comment) {
    script += '/ip firewall mangle\n';
    script += ':for i from=1 to=' + wanCount + ' do={\n';
    script += 'add comment=' + comment + ' chain=output connection-mark=("WAN$i_conn") action=mark-routing new-routing-mark=("WAN$i")}\n\n';
  }

  // Add input and output rules with comments
  addInputRule('Comment for input rule');
  addOutputRule('Comment for output rule');

  // Add rules for prerouting
  script += '/ip firewall mangle\n';
  for (let i = 1; i <= wanCount; i++) {
    const perConnectionClassifier = `${wanCount}/${i - 1}`;
    script += `add chain=prerouting comment=z dst-address-type=!local src-address=${sourceAddress} per-connection-classifier=both-addresses-and-ports:${perConnectionClassifier} action=mark-connection new-connection-mark=WAN${i}_conn passthrough=yes\n`;
  }

  // Add rules for marking routing
  script += '/ip firewall mangle\n';
  script += `:for i from=1 to=${wanCount} do={\n`;
  script += `add comment=z chain=prerouting connection-mark=("WAN$i_conn") src-address=${sourceAddress} action=mark-routing new-routing-mark=("WAN$i")}\n\n`;

  // Add IP route rules
  script += '/ip route\n';
  script += `:for i from=1 to=${wanCount} do={\n`;
  script += `add dst-address=0.0.0.0/0 gateway=("WAN$i") distance=("$i") check-gateway=ping}\n\n`;

  // Add NAT rules
  script += '/ip firewall nat\n';
  script += ':for i from=1 to=' + wanCount + ' do={\n';
  script += `add chain=srcnat out-interface=("WAN$i") action=masquerade}\n`;

  script += '}\n\n';

  // Display the generated script in the output element
  document.getElementById('outputScript').innerText = script;
}

  
  document.getElementById('copyScriptButton').addEventListener('click', copyScriptToClipboard);
  
