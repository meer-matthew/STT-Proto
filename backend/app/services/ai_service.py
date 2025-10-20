"""
AI Service for handling LLM integrations
Supports multiple AI providers: OpenAI, Anthropic, or local models
"""

import os
from typing import Generator, Optional
import json


class AIService:
    """Service for generating AI responses with streaming support"""

    def __init__(self):
        self.provider = os.environ.get('AI_PROVIDER', 'mock')  # 'openai', 'anthropic', or 'mock'
        self.api_key = os.environ.get('AI_API_KEY', '')
        self.model = os.environ.get('AI_MODEL', 'gpt-3.5-turbo')

    def generate_streaming_response(
        self,
        user_message: str,
        conversation_history: Optional[list] = None,
        system_prompt: Optional[str] = None
    ) -> Generator[str, None, None]:
        """
        Generate a streaming AI response

        Args:
            user_message: The user's input message
            conversation_history: Previous messages in the conversation
            system_prompt: Optional system prompt to guide AI behavior

        Yields:
            Text chunks from the AI response
        """
        if self.provider == 'openai':
            yield from self._stream_openai(user_message, conversation_history, system_prompt)
        elif self.provider == 'anthropic':
            yield from self._stream_anthropic(user_message, conversation_history, system_prompt)
        else:
            yield from self._stream_mock(user_message, conversation_history, system_prompt)

    def _stream_openai(
        self,
        user_message: str,
        conversation_history: Optional[list],
        system_prompt: Optional[str]
    ) -> Generator[str, None, None]:
        """Stream response from OpenAI API"""
        try:
            import openai

            openai.api_key = self.api_key

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})

            if conversation_history:
                for msg in conversation_history:
                    role = "assistant" if msg.get('sender_type') == 'assistant' else "user"
                    messages.append({"role": role, "content": msg.get('message', '')})

            messages.append({"role": "user", "content": user_message})

            response = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                stream=True
            )

            for chunk in response:
                if chunk.choices[0].delta.get('content'):
                    yield chunk.choices[0].delta.content

        except ImportError:
            yield from self._stream_mock(user_message, conversation_history, system_prompt)
        except Exception as e:
            yield f"Error generating response: {str(e)}"

    def _stream_anthropic(
        self,
        user_message: str,
        conversation_history: Optional[list],
        system_prompt: Optional[str]
    ) -> Generator[str, None, None]:
        """Stream response from Anthropic Claude API"""
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.api_key)

            messages = []
            if conversation_history:
                for msg in conversation_history:
                    role = "assistant" if msg.get('sender_type') == 'assistant' else "user"
                    messages.append({"role": role, "content": msg.get('message', '')})

            messages.append({"role": "user", "content": user_message})

            with client.messages.stream(
                model=self.model,
                max_tokens=1024,
                system=system_prompt or "You are a helpful assistant.",
                messages=messages
            ) as stream:
                for text in stream.text_stream:
                    yield text

        except ImportError:
            yield from self._stream_mock(user_message, conversation_history, system_prompt)
        except Exception as e:
            yield f"Error generating response: {str(e)}"

    def _stream_mock(
        self,
        user_message: str,
        conversation_history: Optional[list],
        system_prompt: Optional[str]
    ) -> Generator[str, None, None]:
        """Mock streaming response for testing without API keys"""
        import time

        # Generate a contextual mock response
        sample_responses = [
            f"Thank you for your message: '{user_message}'. I understand you're looking for assistance. ",
            "As an AI assistant in the Wakaku STT application, I'm here to help facilitate communication. ",
            "This is a sample streaming response. In production, this would be replaced with actual AI-generated content from OpenAI, Anthropic, or another LLM provider. ",
            "You can configure the AI provider by setting the AI_PROVIDER environment variable to 'openai' or 'anthropic', and providing the appropriate API key."
        ]

        response = "".join(sample_responses)
        words = response.split()

        for word in words:
            yield word + " "
            time.sleep(0.05)  # Simulate network delay


# Global instance
ai_service = AIService()
