var express = require("express");
var app = express();

app.use(express.static("dist/mierukun"));
app.get('/', function (req, res) {
    res.redirect('/');
});

app.post('/predict', async (req, res) => {
    console.error(req);
    console.error(res);
    try {
        const instances = req.body; // リクエストボディからインスタンスを取得

        // Vertex AI へのリクエストを作成
        const request = {
            endpoint,
            instances,
        };

        // Vertex AI に予測をリクエスト
        const response = await createNonStreamingMultipartContent();

        // レスポンスを返す
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).send('予測中にエラーが発生しました');
    }
});

app.listen(8080);

const { VertexAI } = require('@google-cloud/vertexai');

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createNonStreamingMultipartContent(
    projectId = 'mierukun-github',
    location = 'us-central1',
    model = 'gemini-1.5-pro',
    image = 'gs://generativeai-downloads/images/scones.jpg',
    mimeType = 'image/jpeg'
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({ project: projectId, location: location });

    // Instantiate the model
    const generativeVisionModel = vertexAI.getGenerativeModel({
        model: model,
    });

    // For images, the SDK supports both Google Cloud Storage URI and base64 strings
    const filePart = {
        fileData: {
            fileUri: image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: 'what is shown in this image?',
    };

    const request = {
        contents: [{ role: 'user', parts: [filePart, textPart] }],
    };

    console.log('Prompt Text:');
    console.log(request.contents[0].parts[1].text);

    console.log('Non-Streaming Response Text:');
    // Create the response stream
    const responseStream =
        await generativeVisionModel.generateContentStream(request);

    // Wait for the response stream to complete
    const aggregatedResponse = await responseStream.response;

    // Select the text from the response
    const fullTextResponse =
        aggregatedResponse.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);
}
