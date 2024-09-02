var express = require("express");
var app = express();

app.use(express.static("dist/mierukun"));
app.use(express.json({
    limit: '500mb'
}));
// app.use(express.urlencoded({
//     limit: '100mb',
//     extended: true
// }))

app.get('/', function (req, res) {
    res.redirect('/');
});

app.post('/gemini', async (req, res) => {
    try {
        // Vertex AI に予測をリクエスト
        const response = await createNonStreamingMultipartContent(req.body);

        // レスポンスを返す
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500)
            .send({
                text: 'エラーが発生しました'
            });
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

    // const request = {
    //     contents
    // };

    console.log('Prompt Text:');
    console.log(contents);

    console.log('Non-Streaming Response Text:');
    // Create the response stream
    const response = await generativeVisionModel.generateContent(contents);
    // const response = await generativeVisionModel.generateContent(request);

    // Wait for the response stream to complete
    const aggregatedResponse = await response.response;

    console.log(aggregatedResponse);

    // Select the text from the response
    const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);

    return fullTextResponse;
}
