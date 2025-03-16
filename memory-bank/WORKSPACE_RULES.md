# Vibe Town - Workspace Rules and Guidelines

## Core Architecture
- Client-server architecture with Phaser 3 + React (client) and Colyseus + Node.js (server)
- TypeScript throughout
- VibeTownRoom (server/room.ts) is single source of truth for game state
- Phaser scenes react to Colyseus room state changes

## Key Principles

### 1. Modularity (Single Responsibility)
- Every file, class, component, and function has ONE clear purpose
- Keep functions/classes under ~30 lines
- Break down complex logic into smaller, focused pieces
- React = UI, Phaser = Game Rendering, Colyseus = State Management

### 2. UI Components (React)
- ALL UI elements are React components
- This includes in-game UI (chat indicators, dialogs, settings)
- Keep UI logic separate from game logic

### 3. State Management (Colyseus)
- VibeTownRoom is central authority for game state
- Use Schema classes (Player, State) for shared state
- Clients NEVER directly modify game state
- All changes go through server messages

### 4. Game Scene (Phaser)
- MainScene primarily reacts to Colyseus state changes
- Use proper event handlers (onAdd, onChange, onRemove)
- No server-side logic in Phaser scenes
- Focus on rendering and input handling

### 5. Communication
- Use messages for client-server communication
- Examples: "move", "setNickname", etc.
- Server broadcasts state updates to all clients
- No direct function calls between client/server

### 6. Error Handling
- Try-catch blocks in message handlers
- Handle PeerJS connection errors
- Handle network request failures
- Proper error logging (console vs. service)

### 7. Testing (Vitest)
- Write tests for new features/components
- Focus on room logic and component interactions
- Use mocking to isolate code units
- Test both success and error cases

### 8. Code Organization
- Use explicit file paths (e.g., src/scenes/MainScene.ts)
- Clear folder structure
- Consistent naming conventions
- Proper TypeScript usage throughout

### 9. TypeScript Guidelines
- Define clear types for all variables
- Type all function parameters and returns
- Create interfaces for component props
- Avoid 'any' type unless necessary

### 10. Progress Tracking
- Update `/memory-bank/progress.md` after every significant change
- Use plain English, clear and concise language
- Include date of changes
- Group related changes under appropriate headers
- List next steps or pending items
- Format updates with date, category, and bullet points

## Security Notes
- Never expose API keys in code
- Use environment variables for sensitive data
- Implement proper error handling
- Validate all user input

Remember: These rules are designed to create maintainable, secure, and well-organized code. When in doubt, favor clarity and simplicity over complexity.
