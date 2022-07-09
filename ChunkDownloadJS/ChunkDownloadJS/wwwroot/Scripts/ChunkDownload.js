// Contants (this values are only for test purposes: change them as you need)
const MIN_CHUNK_SIZE = 100 * 1024; // 100KB
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CALL_ATTEMPTS = 4;
const PROCESS_DURATION_TIME = 2 * 1000; // 2 sec.



async function downloadFile(fileName) {

    document.getElementById('chunkList').innerHTML = '';

    // A bit of input valdation
    if (!fileName) {
        document.getElementById('statusLabel').innerText = 'fileName parameter is required';
    }

    // showSaveFilePicker is only supported in Chrome and Edge (see https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker#browser_compatibility)
    if (!window.showSaveFilePicker) {
        document.getElementById('statusLabel').innerText = 'For using this test you must use Chrome or Edge';
    }

    // Open the modal window for letting the user choose the new file's name and destination
    const handle = await window.showSaveFilePicker({
        suggestedName: fileName
    }).catch(e => console.log('The user closed the SaveFilePicker')); // If the user closes the window without choosing, an Error is thrown. Catch the error and then check if handle has a value

    if (!handle) return;

    document.getElementById('statusLabel').innerText = 'Download in progress';

    // Set some variables that we'll use for performing the calls
    let offset = 0;
    let attempts = 0;
    let chunkSize = MIN_CHUNK_SIZE; // Start with min size. Then, if needed, we'll increase this value

    // Create a writable stream
    const writable = await handle.createWritable();

    try {

        const md5 = CryptoJS.algo.MD5.create();

        while (true) {

            if (attempts > MAX_CALL_ATTEMPTS) {
                throw new Error(`Unable to pefrom the operation: a call failed ${MAX_CALL_ATTEMPTS} times`);
            }
            
            const requestBody = { fileName: fileName, offset: offset, chunkSize: chunkSize }

            // Save the time of the request: we'll use it to check how long the request takes and fit the chunk size
            const timeStart = Date.now();

            let result = null;

            // Retry logic
            try {
                result = await fetch('/api/Download/chunk', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (result.status !== 200) {
                    console.log('API call returned HTTP status code: ' + result.status);
                    throw new Error('API call returned HTTP status code: ' + result.status);
                }
            } catch (err) {
                attempts++;
                result = null;
                await new Promise(resolve => setTimeout(resolve, (2 ** attempts) * 1000)); // Exponential wait
            }

            if (result) {
                // OK now we must read the response body
                const responseBody = await result.json();
                
                // Get the decoded binary from response
                const binary = base64DecToArr(responseBody.data);
                // Write inary to the file
                await writable.write(binary);
                // Update the MD5 with the new binary
                md5.update(CryptoJS.lib.WordArray.create(binary));

                const newListItem = document.createElement('li');
                newListItem.innerText = `Required chunk of size: ${chunkSize} bytes, received chunk of size ${binary.length}`;
                document.getElementById('chunkList').appendChild(newListItem);

                // Get the duration of the process and recompute chunk size
                const processDuration = (Date.now() - timeStart); // milliseconds
                chunkSize = ComputeNextRequestChunkSize(processDuration, chunkSize);

                // Update other params
                offset += binary.length;
                attempts = 0;

                if (responseBody.md5) {
                    // OK we are at the end: check the MD5
                    const clientHash = md5.finalize().toString(CryptoJS.enc.Base64);
                    if (responseBody.md5 !== clientHash) throw new Error('Unable to verify the MD5');
                    break;
                }
            }
        }

        document.getElementById('statusLabel').innerText = 'Download Completed';

    } catch (err) {
        document.getElementById('statusLabel').innerText = err; // Just for testing purposes
        writable.truncate(0); // An error occured: we can't delete the file (we should ask the usere to select it again ... Not so good), so we can empty it
    } finally {
        writable.close(); // This call is really important. Without this the temporary file won't be deleted and the file will left opened
    }
}


function ComputeNextRequestChunkSize(processDuration, currentChunkSize) {
    // Compute newChunkSize : REQUEST_DURATION_TIME = currentChunkSize : requestDuration
    const newChunkSize = Math.floor((PROCESS_DURATION_TIME * currentChunkSize) / processDuration);
    if (newChunkSize > MAX_CHUNK_SIZE) return MAX_CHUNK_SIZE;
    else if (newChunkSize < MIN_CHUNK_SIZE) return MIN_CHUNK_SIZE;
    else return newChunkSize;
}


// The following code is taken from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
function base64DecToArr(sBase64, nBlocksSize) {

    var
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ''), nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++ , nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;

        }
    }

    return taBytes;
}


// The following code is taken from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
function b64ToUint6(nChr) {

    return nChr > 64 && nChr < 91 ?
        nChr - 65
        : nChr > 96 && nChr < 123 ?
            nChr - 71
            : nChr > 47 && nChr < 58 ?
                nChr + 4
                : nChr === 43 ?
                    62
                    : nChr === 47 ?
                        63
                        :
                        0;

}
