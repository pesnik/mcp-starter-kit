#!/usr/bin/env python3
"""
Web scraping MCP server using Python
Provides tools for web scraping, URL fetching, and content analysis
"""

import asyncio
import json
import sys
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequest,
    ListToolsRequest,
    Tool,
    TextContent,
    CallToolResult,
    ListToolsResult,
)


class WebMCPServer:
    def __init__(self):
        self.server = Server("web-scraper")
        self.setup_handlers()

    def setup_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> ListToolsResult:
            return ListToolsResult(
                tools=[
                    Tool(
                        name="fetch_url",
                        description="Fetch content from a URL",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "The URL to fetch",
                                },
                                "timeout": {
                                    "type": "number",
                                    "description": "Request timeout in seconds",
                                    "default": 30,
                                },
                            },
                            "required": ["url"],
                        },
                    ),
                    Tool(
                        name="extract_links",
                        description="Extract all links from a webpage",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "The URL to extract links from",
                                },
                                "base_url": {
                                    "type": "string",
                                    "description": "Base URL for relative links",
                                },
                            },
                            "required": ["url"],
                        },
                    ),
                    Tool(
                        name="extract_text",
                        description="Extract clean text content from HTML",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "html": {
                                    "type": "string",
                                    "description": "HTML content to extract text from",
                                },
                                "selector": {
                                    "type": "string",
                                    "description": "CSS selector to target specific elements",
                                },
                            },
                            "required": ["html"],
                        },
                    ),
                ]
            )

        @self.server.call_tool()
        async def handle_call_tool(
            name: str, arguments: Optional[Dict[str, Any]]
        ) -> CallToolResult:
            try:
                if name == "fetch_url":
                    return await self.fetch_url(arguments or {})
                elif name == "extract_links":
                    return await self.extract_links(arguments or {})
                elif name == "extract_text":
                    return await self.extract_text(arguments or {})
                else:
                    raise ValueError(f"Unknown tool: {name}")
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: {str(e)}")],
                    isError=True,
                )

    async def fetch_url(self, args: Dict[str, Any]) -> CallToolResult:
        url = args["url"]
        timeout = args.get("timeout", 30)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "text/html" in content_type:
                soup = BeautifulSoup(response.text, "html.parser")
                title = soup.title.string if soup.title else "No title"
                result = {
                    "url": str(response.url),
                    "status_code": response.status_code,
                    "content_type": content_type,
                    "title": title,
                    "content": response.text,
                    "text_content": soup.get_text(strip=True)[:1000] + "...",
                }
            else:
                result = {
                    "url": str(response.url),
                    "status_code": response.status_code,
                    "content_type": content_type,
                    "content": response.text,
                }

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2))]
            )

    async def extract_links(self, args: Dict[str, Any]) -> CallToolResult:
        url = args["url"]
        base_url = args.get("base_url", url)

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            links = []

            for link in soup.find_all("a", href=True):
                href = link["href"]
                absolute_url = urljoin(base_url, href)
                links.append({
                    "text": link.get_text(strip=True),
                    "href": href,
                    "absolute_url": absolute_url,
                })

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(links, indent=2))]
            )

    async def extract_text(self, args: Dict[str, Any]) -> CallToolResult:
        html = args["html"]
        selector = args.get("selector")

        soup = BeautifulSoup(html, "html.parser")

        if selector:
            elements = soup.select(selector)
            text = "\n".join(el.get_text(strip=True) for el in elements)
        else:
            text = soup.get_text(strip=True)

        return CallToolResult(
            content=[TextContent(type="text", text=text)]
        )

    async def run(self):
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream, write_stream, self.server.create_initialization_options()
            )


async def main():
    server = WebMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())