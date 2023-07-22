    async function fetchTransactions(node) {
      try {
        const response = await fetch(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${node.nodeAddress}`);
        const json = await response.json();
        const nodeTransactionsArray = json.result;
        if (nodeTransactionsArray.length > 0) {
          const lastTransactionTime = Math.round((Date.now() / 1000 - nodeTransactionsArray[0].timeStamp) / 3600);
          return { ...node, lastTransactionTime };
        }
      } catch (error) {
        console.log(error);
      }
    }

    function generateNewNodeAddressText(nodeAddress) {
      return window.innerWidth < window.innerHeight ? `${nodeAddress.substr(0, 5)}. . .${nodeAddress.substr(-4)}` : nodeAddress;
    }

    function addNodeToTable(nodeName, nodeAddress, transactionTime) {
      const table = document.getElementById('myTable');



      const newRow = table.insertRow();
      const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
      newRow.innerHTML = `<td>${nodeName}</td><td><a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}">${newNodeAddressText}</a></td><td>${transactionTime}</td><td><img src="https://i.ibb.co/xHbVTPk/delete-3.webp" alt="Delete" class="delete-logo"></td>`;
      const deleteLogo = newRow.querySelector('.delete-logo');
      deleteLogo.addEventListener('click', () => {
        const confirmation = confirm("Please confirm this action!");
        if (confirmation) {
          table.deleteRow(newRow.rowIndex);
          deleteNodeFromStorage(nodeAddress);
        }
      });
      if (transactionTime !== 'Last Hour' && transactionTime > 15) {
        newRow.classList.add('red-text');
      }
    }

    const nodeNameInput = document.getElementById('node-name');
    const nodeAddressInput = document.getElementById('node-address');
    const addNodeBtn = document.getElementById('add-node');

    nodeNameInput.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        addNodeBtn.click();
      }
    });

    nodeAddressInput.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        addNodeBtn.click();
      }
    });

    function deleteNodeFromStorage(nodeAddress) {
      const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const updatedNodes = nodes.filter((node) => node.nodeAddress !== nodeAddress);
      localStorage.setItem('nodes', JSON.stringify(updatedNodes));
    }

    function addNodeToDatabase(nodeName, nodeAddress) {
      if (nodeName.trim() === '' || nodeAddress.trim() === '') {
        alert('Please complete both fields!');
        return;
      }

      const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const newNode = { nodeName, nodeAddress };
      nodes.push(newNode);
      localStorage.setItem('nodes', JSON.stringify(nodes));
    }

    document.addEventListener('DOMContentLoaded', async () => {
      const storedNodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const table = document.getElementById('myTable');
      const existingAddresses = new Set();

      const addresses = Array.from(table.querySelectorAll('td:nth-child(2) a'));
      addresses.forEach(address => {
        existingAddresses.add(address.textContent);
      });

      const nodeDataArray = await Promise.all(storedNodes.map(fetchTransactions));
      nodeDataArray
        .filter(Boolean)
        .forEach(({ nodeName, nodeAddress, lastTransactionTime }) => {
          const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
          addNodeToTable(nodeName, nodeAddress, lastTransactionTime || 'Last Hour');
          existingAddresses.add(nodeAddress);
        });
      table.style.display = 'table';

      const addNodeBtn = document.getElementById('add-node');

      addNodeBtn.addEventListener('click', async () => {
        const nodeName = document.getElementById('node-name').value;
        const nodeAddress = document.getElementById('node-address').value;

        if (nodeName.trim() === '' || nodeAddress.trim() === '') {
          alert('Please complete both fields!');
          return;
        }

        if (existingAddresses.has(nodeAddress)) {
          alert('This address already exists!');
          return;
        }

        addNodeBtn.classList.add('clicked');
        setTimeout(() => {
          addNodeBtn.classList.remove('clicked');
        }, 120);

        const nodeData = await fetchTransactions({ nodeName, nodeAddress });
        if (nodeData) {
          addNodeToTable(nodeName, nodeAddress, nodeData.lastTransactionTime || 'Last Hour');
          addNodeToDatabase(nodeName, nodeAddress);
          document.getElementById('node-name').value = '';
          document.getElementById('node-address').value = '';
          existingAddresses.add(nodeAddress);
        }
      });
    });

    window.addEventListener('resize', () => {
      const addresses = document.querySelectorAll('td:nth-child(2) a');
      addresses.forEach((address) => {
        address.textContent = generateNewNodeAddressText(address.textContent);
      });
    });

function downloadBackup() {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  let backupContent = '';
  nodes.forEach((node) => {
    backupContent += `{NodeName: ${JSON.stringify(node.nodeName)}, NodeAddress: ${JSON.stringify(node.nodeAddress)}},\n`;
  });

  const blob = new Blob([backupContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nodes_backup.txt';
  link.click();
}

function downloadBackupJSON() {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const backupData = JSON.stringify(nodes, null, 2);
  const blob = new Blob([backupData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'nodes_backup.json';
  link.click();

  URL.revokeObjectURL(url);
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const contents = e.target.result;
      try {
        const nodes = JSON.parse(contents);
        if (Array.isArray(nodes)) {
          localStorage.setItem('nodes', JSON.stringify(nodes));
          location.reload();
        } else {
          throw new Error('Invalid backup file format.');
        }
      } catch (error) {
        console.log('Error parsing backup file:', error);
        alert('Error parsing backup file. Please make sure the file is in the correct format.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

const downloadBackupBtn = document.getElementById('download-backup');
downloadBackupBtn.addEventListener('click', downloadBackupJSON);

const restoreBackupBtn = document.getElementById('restore-backup');
restoreBackupBtn.addEventListener('click', restoreBackup);
