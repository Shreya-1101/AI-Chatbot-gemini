from flask import Flask, render_template, request, jsonify
from google import genai
import os
import PyPDF2
import io

app = Flask(__name__)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

extracted_resume_text = ""

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_resume():
    global extracted_resume_text
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        extracted_resume_text = text
        return jsonify({"message": "Resume uploaded successfully! You can now ask me anything about it."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chat", methods=["POST"])
def chat_response():
    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"error": "Empty message"}), 400
    try:
        if extracted_resume_text:
            prompt = f"""The user has uploaded their resume. Here is the resume content:

{extracted_resume_text}

Now answer the user's question: {user_message}

If the question is about the resume, give specific feedback based on the resume content.
If it's a general question, answer normally."""
        else:
            prompt = user_message

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)