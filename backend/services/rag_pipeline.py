import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

llm = ChatOpenAI(
    model="gpt-4o-mini",
    streaming=False,
    api_key=os.environ.get("OPENAI_API_KEY")
)

async def run_rag(lat: float, lon: float, query: str, chunks: list[str]) -> str:
    context = "\n\n".join(chunks) if chunks else "No field data available for this location."
    messages = [
        SystemMessage(content=(
            f"You are a spatial intelligence assistant for agricultural field data.\n"
            f"The user clicked lat={lat:.5f}, lon={lon:.5f}.\n"
            f"Answer based on this field data:\n\n{context}"
        )),
        HumanMessage(content=query)
    ]
    result = llm.invoke(messages)
    return result.content
