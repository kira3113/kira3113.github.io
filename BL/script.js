// script.js
function generateScript() {
    const wanCount = +document.getElementById('wanCount').value;
    const sourceAddress = document.getElementById('sourceAddress').value;
  
    if (isNaN(wanCount) || wanCount < 1 || wanCount > 246) {
      alert('Please enter a valid number of WAN Connections (1-246).');
      return;
    }
  
    let script = '';
  
    function addRule(chain, action, comment) {
      script += `/ip firewall mangle\n`;
      script += `:for i from=1 to=${wanCount} do={\n`;
      script += `add comment=${comment} chain=${chain} in-interface=("WAN$i") action=${action} new-connection-mark=("WAN$i_conn")}\n\n`;
    }
  
    addRule('input', 'mark-connection', 'z');
    addRule('output', 'mark-routing', 'z');
  
    script += '/ip firewall mangle\n';
    for (let i = 1; i <= wanCount; i++) {
      const perConnectionClassifier = `${wanCount}/${i - 1}`;
      script += `add chain=prerouting comment=z dst-address-type=!local src-address=${sourceAddress} per-connection-classifier=both-addresses-and-ports:${perConnectionClassifier} action=mark-connection new-connection-mark=WAN${i}_conn passthrough=yes\n`;
    }
  
    script += '\n/ip firewall mangle\n';
    script += `:for i from=1 to=${wanCount} do={\n`;
    script += `add comment=z chain=prerouting connection-mark=("WAN$i_conn") src-address=${sourceAddress} action=mark-routing new-routing-mark=("WAN$i")}\n\n`;
  
    script += '/ip route\n';
    script += `add dst-address=0.0.0.0/0 gateway=("WAN$i") distance=("$i") check-gateway=ping}\n\n`;
  
    script += '/ip firewall nat\n';
    script += ':for i from=1 to=' + wanCount + ' do={\n';
    script += `add chain=srcnat out-interface=("WAN$i") action=masquerade}\n`;
  
    script += '}\n\n';
  
    document.getElementById('outputScript').innerText = script;
  }
  
  function copyScriptToClipboard() {
    const scriptText = document.getElementById('outputScript').textContent;
    const textArea = document.createElement('textarea');
    textArea.value = scriptText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Script copied to clipboard!');
  }
  
  document.getElementById('copyScriptButton').addEventListener('click', copyScriptToClipboard);
  