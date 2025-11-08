def get_chatbot_response_gemini(client, model_name, messages, temperature=0):
    """
    Hàm gửi hội thoại đến model Gemini và nhận phản hồi văn bản.

    Parameters:
        client (genai.Client): client Gemini đã khởi tạo với API key.
        model_name (str): tên model Gemini, ví dụ "gemini-2.0-flash" hoặc "gemini-2.5-flash".
        messages (list): danh sách dict dạng [{"role": "system"|"user"|"assistant", "content": "..."}].
        temperature (float): mức độ sáng tạo của câu trả lời (0 = rất chính xác, 1 = tự do hơn).

    Returns:
        str: phản hồi của model (nội dung văn bản).
    """

    # Chuyển các tin nhắn thành định dạng "nội dung hội thoại"
    conversation = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        conversation.append(f"{role.upper()}: {content}")

    # Ghép hội thoại thành một đoạn văn bản thống nhất
    full_prompt = "\n".join(conversation)

    # Gọi Gemini API
    response = client.models.generate_content(
        model=model_name,
        contents=full_prompt
    )

    # Lấy text trả về
    return response.text.strip() if hasattr(response, "text") else str(response)

