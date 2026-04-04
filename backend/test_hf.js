const { HfInference } = require('@huggingface/inference');
const hf = new HfInference(process.env.HF_TOKEN);

async function run() {
  try {
    const result = await hf.textGeneration({
      model: 'google/gemma-1.1-7b-it',
      inputs: '<start_of_turn>user\nSay hello<end_of_turn>\n<start_of_turn>model\n',
      parameters: { max_new_tokens: 50 }
    });
    console.log('SUCCESS:', result.generated_text);
  } catch (err) {
    console.error('ERROR RESPONSE:', JSON.stringify(err.httpResponse?.body, null, 2));
  }
}
run();
