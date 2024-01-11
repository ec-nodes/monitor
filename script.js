const MAX_RETRIES = 5;
const RETRY_INTERVAL = 1500;
const existingAddresses = new Set();
const pendingAddresses = new Set();

function startProgressAnimation(cell) {
    let progress = 1;
    const progressText = [".", "..", "..."];
    const progressInterval = setInterval(() => {
        cell.textContent = progressText[progress % 4];
        progress++;
    }, 300);
    return progressInterval;
}

function stopProgressAnimation(progressInterval) {
    clearInterval(progressInterval);
}

async function fetchTransactions(node) {
    try {
        if (pendingAddresses.has(node.nodeAddress)) {
            return null;
        }

        pendingAddresses.add(node.nodeAddress);

        let retryCount = 0;
        let response = null;

        while (retryCount < MAX_RETRIES && !response) {
            try {
                const fetchResponse = await fetch(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${node.nodeAddress}`);
                const json = await fetchResponse.json();
                const nodeTransactionsArray = json.result;

                if (nodeTransactionsArray.length > 0) {
                    existingAddresses.add(node.nodeAddress);
                    response = { ...node, lastTransactionTime: Math.round((Date.now() / 1000 - nodeTransactionsArray[0].timeStamp) / 3600) };
                }
            } catch (error) {
                console.log(`Error fetching data for ${node.nodeAddress}: ${error}`);
            } finally {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            }
        }

        return response;
    } finally {
        pendingAddresses.delete(node.nodeAddress);
    }
}

function generateNewNodeAddressText(nodeAddress) {
    return window.innerWidth < window.innerHeight ? `${nodeAddress.substr(0, 5)}. . .${nodeAddress.substr(-4)}` : nodeAddress;
}

function addNodeToTable(nodeName, nodeAddress, transactionTime) {
    const table = document.getElementById('myTable');
    const newRow = table.insertRow();
    const newNodeAddressText = generateNewNodeAddressText(nodeAddress);

    const transactionTimeText = typeof transactionTime === 'number' ? `${transactionTime} h` : transactionTime;

    newRow.innerHTML = `<td class="node-name">${nodeName}</td><td class="node-address"><a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}">${newNodeAddressText}</a></td><td>${transactionTimeText}</td><td><img src="https://i.ibb.co/xHbVTPk/delete-3.webp" alt="Delete" class="delete-logo"></td>`;
    const deleteLogo = newRow.querySelector('.delete-logo');
    deleteLogo.addEventListener('click', () => {
        const confirmation = confirm("Please confirm this action!");
        if (confirmation) {
            table.deleteRow(newRow.rowIndex);
            deleteNodeFromStorage(nodeAddress);
        }
    });

function addNodeToTable(nodeName, nodeAddress, transactionTime) {
    const newRow = table.insertRow();
    newRow.addEventListener('mouseenter', () => {
        newRow.classList.add('highlight-row');
    });

    newRow.addEventListener('mouseleave', () => {
        newRow.classList.remove('highlight-row');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadNodesData();
});

    const cell = newRow.cells[2];
    async function updateCellWithTransactionTime() {
        const response = await fetchTransactions({ nodeName, nodeAddress });

        if (!response) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const retryResponse = await fetchTransactions({ nodeName, nodeAddress });
            if (retryResponse) {
                cell.textContent = retryResponse.lastTransactionTime || 'Last Hour';
                stopProgressAnimation(progressInterval);
                if (typeof retryResponse.lastTransactionTime === 'number' && retryResponse.lastTransactionTime > 17) {
                    newRow.classList.add('red-text');
                }
            } else {
                cell.textContent = 'Retrying';
                stopProgressAnimation(progressInterval);

                await new Promise((resolve) => setTimeout(resolve, 1500));
                const secondRetryResponse = await fetchTransactions({ nodeName, nodeAddress });
                if (secondRetryResponse) {
                    cell.textContent = secondRetryResponse.lastTransactionTime || 'Last Hour';
                    stopProgressAnimation(progressInterval);
                    if (typeof secondRetryResponse.lastTransactionTime === 'number' && secondRetryResponse.lastTransactionTime > 17) {
                        newRow.classList.add('red-text');
                    }
                } else {
                    cell.textContent = 'No Response';
                    stopProgressAnimation(progressInterval);
                }
            }
        } else {
            cell.textContent = response.lastTransactionTime || 'Last Hour';
            stopProgressAnimation(progressInterval);
            if (typeof response.lastTransactionTime === 'number' && response.lastTransactionTime > 17) {
                newRow.classList.add('red-text');
            }
        }
    }

    const progressInterval = startProgressAnimation(cell);
    updateCellWithTransactionTime();

    const nodeNameCell = newRow.cells[0];
    nodeNameCell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const newName = prompt("Enter new name:", nodeName);
        if (newName) {
            nodeNameCell.textContent = newName;
            updateNodeInStorage(nodeAddress, { nodeName: newName });
        }
    });

const nodeAddressCell = newRow.cells[1];
nodeAddressCell.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const newAddress = prompt("Enter new address:", nodeAddress);

    if (newAddress) {
        const newNodeAddressText = generateNewNodeAddressText(newAddress);

        if (existingAddresses.has(newAddress)) {
            alert('This address already exists!');
            return;
        }

        if (!isValidCryptoAddress(newAddress)) {
            alert('Invalid address!');
            return;
        }

function isValidCryptoAddress(address) {
    return /^[a-fA-F0-9]{40}$/.test(address);
}

        nodeAddressCell.innerHTML = `<a href="https://blockexplorer.bloxberg.org/address/${newAddress}">${newNodeAddressText}</a>`;
        updateNodeInStorage(nodeAddress, { nodeAddress: newAddress });
    }
});

    function updateNodeInStorage(oldAddress, updatedData) {
        const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
        const updatedNodes = nodes.map((node) => {
            if (node.nodeAddress === oldAddress) {
                return { ...node, ...updatedData };
            } else {
                return node;
            }
        });
        localStorage.setItem('nodes', JSON.stringify(updatedNodes));
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

async function loadNodesData() {
    const storedNodes = JSON.parse(localStorage.getItem('nodes')) || [];
    const table = document.getElementById('myTable');

    existingAddresses.clear();
    pendingAddresses.clear();

    table.style.display = 'table';

    storedNodes.forEach(({ nodeName, nodeAddress }) => {
        const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
        addNodeToTable(nodeName, nodeAddress, '.');
        existingAddresses.add(nodeAddress);
    });

    await Promise.all(storedNodes.map(async ({ nodeName, nodeAddress }) => {
        try {
            const response = await fetchTransactions({ nodeName, nodeAddress });
            if (response) {
                const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
                const row = table.querySelector(`tr td:nth-child(2) a[href="https://blockexplorer.bloxberg.org/address/${nodeAddress}"]`).parentNode.parentNode;
                const cell = row.cells[2];
                const progressInterval = startProgressAnimation(cell);

                setTimeout(() => {
                    cell.textContent = response.lastTransactionTime || 'Last Hour';
                    stopProgressAnimation(progressInterval);
                }, 1000);

                if (typeof response.lastTransactionTime === 'number' && response.lastTransactionTime > 17) {
                    row.classList.add('red-text');
                }
            }
        } catch (error) {
            console.error(`Error fetching data for ${nodeAddress}: ${error}`);
        }
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadNodesData();

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

function downloadBackupJSON() {
    const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
    const backupData = JSON.stringify(nodes, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'Nodes_Backup.json';
    link.click();

    URL.revokeObjectURL(url);
}

function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const contents = await file.text();
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
    });
    input.click();
}

const downloadBackupBtn = document.getElementById('download-backup');
downloadBackupBtn.addEventListener('click', downloadBackupJSON);

const restoreBackupBtn = document.getElementById('restore-backup');
restoreBackupBtn.addEventListener('click', restoreBackup);
