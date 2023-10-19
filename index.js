const express = require('express');
const path = require('path');
const fs = require('fs');
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const multer = require('multer');

const app = express();

const clientId = '91577da1f28244d0b2aff95d03b991b9';
const clientSecret = 'p8e-V-JiD-0gmgnFBEEhtWp0WDcQOpddNO6h';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Invalid file format. Only PDF files are allowed.'), false);
        }
        cb(null, true);
    },
});

app.post('/convert', upload.single('pdfFile'), async (req, res) => {
    try {
        const credentials = PDFServicesSdk.Credentials
            .servicePrincipalCredentialsBuilder()
            .withClientId(clientId)
            .withClientSecret(clientSecret)
            .build();

        const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
        const exportPDF = PDFServicesSdk.ExportPDF;
        const exportPDFOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOCX);

        const input = PDFServicesSdk.FileRef.createFromLocalFile(req.file.path);
        exportPDFOperation.setInput(input);

        const options = new exportPDF.options.ExportPDFOptions(exportPDF.options.ExportPDFOptions.OCRSupportedLocale.EN_US);
        exportPDFOperation.setOptions(options);

        const outputFilePath = `output/converted_document_${Date.now()}.docx`;

        const result = await exportPDFOperation.execute(executionContext);
        const outputPath = path.join(__dirname, outputFilePath);

        // Save the converted Word file to the output folder
        result.saveAsFile(outputPath);

        // Remove the temporary uploaded file
        fs.unlinkSync(req.file.path);

        // Send the download link and filename in the response
        res.status(200).json({
            success: true,
            downloadLink: `${outputFilePath}`, // Store the converted file path (without '/')
            fileName: path.basename(outputPath), // Use the same filename from the server response
        });
    } catch (err) {
        console.error('Exception encountered while executing operation', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/output', express.static(path.join(__dirname, 'output')));

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'output', req.params.filename);
    const fileName = path.basename(filePath);

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ success: false, error: 'Error downloading file' });
        }
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
