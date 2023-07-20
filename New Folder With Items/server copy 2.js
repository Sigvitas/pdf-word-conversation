const express = require('express');
const path = require('path');
const fs = require('fs');
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const multer = require('multer');

const app = express();

// Replace these values with your Adobe PDF Services credentials
const clientId = '91577da1f28244d0b2aff95d03b991b9';
const clientSecret = 'p8e-V-JiD-0gmgnFBEEhtWp0WDcQOpddNO6h';

// Configure multer to handle the file upload
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

// Route to handle file upload and conversion
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

        const outputFilePath = `output/export_${Date.now()}.docx`;

        const result = await exportPDFOperation.execute(executionContext);
        const outputPath = path.join(__dirname, outputFilePath);

        // Save the converted Word file to the output folder
        result.saveAsFile(outputPath);

        // Remove the temporary uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({ success: true, downloadLink: outputFilePath });
    } catch (err) {
        console.error('Exception encountered while executing operation', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Root URL route (handle GET requests for the root URL)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
