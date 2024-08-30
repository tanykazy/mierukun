var express = require("express");
var app = express();

app.use(express.static("dist/mierukun"));
app.get('/', function (req, res) {
    res.redirect('/');
});

app.post('/predict', async (req, res) => {
    try {
        // const instances = req.body; // リクエストボディからインスタンスを取得

        // Vertex AI へのリクエストを作成
        // const request = {
        //     endpoint,
        //     instances,
        // };
        console.log('========== Debug ==========');
        // console.log(JSON.stringify(req));
        console.log(JSON.stringify(req.body));

        // console.log(textPart);
        // console.log(audioPart);

        // const response = fetch('/predict', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         contents: [{
        //             role: 'user',
        //             parts: textPart
        //         }, {
        //             role: 'user',
        //             parts: audioPart
        //         }],
        //     })
        // });

        // console.log(response);
        // return response.then(response => response.json());

        // Vertex AI に予測をリクエスト
        const response = await createNonStreamingMultipartContent();

        // レスポンスを返す
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500)
            .send('予測中にエラーが発生しました');
    }
});

app.listen(8080);

const { VertexAI } = require('@google-cloud/vertexai');

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createNonStreamingMultipartContent(
    contents,
    projectId = 'mierukun-github',
    location = 'us-central1',
    model = 'gemini-1.5-pro',
    // image = 'gs://generativeai-downloads/images/scones.jpg',
    // mimeType = 'image/jpeg'
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({
        project: projectId,
        location: location
    });

    // Instantiate the model
    const generativeVisionModel = vertexAI.getGenerativeModel({
        model: model,
    });

    // For images, the SDK supports both Google Cloud Storage URI and base64 strings
    // const filePart = {
    //     fileData: {
    //         fileUri: image,
    //         mimeType: mimeType,
    //     },
    // };

    // const textPart = {
    //     text: 'what is shown in this image?',
    // };

    // const request = {
    //     contents: [{ role: 'user', parts: [filePart, textPart] }],
    // };
    const request = {
        contents: contents,
    };

    console.log('Prompt Text:');
    console.log(request);
    // console.log(request.contents[0].parts[1].text);

    console.log('Non-Streaming Response Text:');
    // Create the response stream
    const responseStream = await generativeVisionModel.generateContentStream(request);

    // Wait for the response stream to complete
    const aggregatedResponse = await responseStream.response;

    // Select the text from the response
    const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);
}
