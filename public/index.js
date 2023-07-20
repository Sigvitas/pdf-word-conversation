document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const progressDiv = document.getElementById('progress');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const downloadLinkElem = document.getElementById('downloadLink');

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(uploadForm);
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            showDownloadButton(data.downloadLink, data.fileName);
        } else {
            alert('Conversion failed: ' + data.error);
        }
    });

    function showDownloadButton(downloadLink, fileName) {
        uploadForm.classList.add('hidden');
        progressDiv.classList.add('hidden');
        downloadLinkElem.classList.remove('hidden');
        downloadLinkElem.href = downloadLink;
        downloadLinkElem.textContent = `Download Converted Word File (${fileName})`;
    }
});
