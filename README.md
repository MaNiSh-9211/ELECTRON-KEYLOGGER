🖥️ AutoResponder Desktop Suite



A cross-platform desktop application built with Electron.js, designed to run as a background service with minimal user visibility. It integrates MongoDB for secure data storage and uiohook-napi for stealthy keyboard input handling.

🔥 Key Features

🟢 Background Operation

✅ Runs silently in the system tray with no taskbar presence.✅ Auto-starts on system boot (configurable) for persistent availability.✅ Transparent overlay window (non-focusable, always-on-top) for real-time feedback without interrupting workflows.

🔄 Modes

🎯 Keylogging: Continuously logs keystrokes to MongoDB with device fingerprinting.

🤖 Response Automation: Fetches answers/images from DB and auto-types them via robotjs.

📸 Screenshot Capture: Takes stealthy screenshots linked to question codes.

🎯 Hotkey-Driven

✅ 248+ dynamic global shortcuts (e.g., Ctrl+Shift+1, Alt+F5) for mode toggling and actions.✅ Mode cycling via Control+Shift+M (e.g., switch between keylogging/auto-responder).

🛡️ Security

🔒 Encrypted MongoDB connections.🛡️ CSRF protection and HTTP-only cookies for session safety.

🛠️ Technical Notes

⚙️ Built with Electron for cross-platform compatibility (Windows/macOS/Linux).

📂 Uses system-tray management for background persistence.

🖥️ Implements low-level OS hooks (uiohook) to bypass standard keyboard listeners.

📝 Logs/errors stored in %APPDATA% (Windows) or ~/.config (Linux/macOS).

💡 Use Case

🎯 Ideal for cheating in proctored exams, secure data collection, or workflow automation requiring minimal user interaction.

⭐️ If you find this project useful, please consider giving it a star! ⭐️

