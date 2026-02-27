# USER.md - User Profile

This file contains user-specific preferences and settings.

## Purpose

Store user preferences that affect how the agent interacts with you. This file helps customize the agent's behavior, response style, and interaction patterns to match your needs.

## Usage

1. Copy this template to your project root or `.kiro/` directory
2. Rename it to `USER.md`
3. Fill in your preferences
4. The agent will read these preferences during interactions

## Template

```markdown
# User Preferences

## Basic Information

### Language
Chinese (中文) / English / Other

### Timezone
Asia/Shanghai / UTC / America/New_York / Other

### Location
China / United States / Other

## Communication Preferences

### Preferred Response Style
- Concise and technical
- Detailed with explanations
- Step-by-step instructions
- Quick answers only

### Code Comments
- English only
- Chinese only
- Bilingual (English + Chinese)
- Minimal comments

### Documentation Language
- Chinese (中文)
- English
- Bilingual

## Technical Preferences

### Programming Languages (in order of preference)
1. TypeScript
2. Python
3. JavaScript
4. Other: ___________

### Frameworks/Tools
- Node.js
- React
- Vue
- Playwright
- Other: ___________

### Code Style
- Functional programming
- Object-oriented programming
- Minimal/concise code
- Verbose/documented code

## Project-Specific Preferences

### Testing Approach
- Write tests first (TDD)
- Write tests after implementation
- Minimal testing
- Comprehensive testing

### Error Handling
- Verbose error messages
- Concise error messages
- Log everything
- Log only critical errors

### Commit Message Style
- Conventional Commits (feat:, fix:, docs:)
- Simple descriptive messages
- Detailed with context
- Minimal

## AI Platform Preferences

### Preferred Platforms (for this project)
1. Claude Web
2. Doubao Web
3. ChatGPT Web
4. Other: ___________

### Model Selection
- Always use the latest/best model
- Balance between speed and quality
- Prefer faster models
- Prefer more capable models

## Work Style

### Interaction Mode
- Ask for confirmation before major changes
- Proceed autonomously with best practices
- Explain reasoning for each decision
- Just show me the results

### Documentation
- Create detailed documentation
- Minimal documentation
- Document only complex parts
- No documentation needed

### Code Review
- Review all changes before committing
- Auto-commit with good messages
- Ask before committing
- Manual commit only

## Special Instructions

### Do's
- Always use Chinese for communication
- Provide code examples
- Explain technical decisions
- Keep code minimal and clean

### Don'ts
- Don't modify tested code (Claude, Doubao)
- Don't create unnecessary files
- Don't use verbose implementations
- Don't repeat information

## Notes

Add any additional preferences or special instructions here:

- ___________
- ___________
- ___________
```

## Example (Filled)

```markdown
# User Preferences

## Basic Information

### Language
Chinese (中文)

### Timezone
Asia/Shanghai

### Location
China

## Communication Preferences

### Preferred Response Style
Concise and technical - 说中文，直接给结果

### Code Comments
English only

### Documentation Language
Chinese (中文)

## Technical Preferences

### Programming Languages (in order of preference)
1. TypeScript
2. JavaScript
3. Python

### Frameworks/Tools
- Node.js
- Playwright
- React

### Code Style
Minimal/concise code - 只写必要的代码

## Project-Specific Preferences

### Testing Approach
Write tests after implementation

### Error Handling
Log only critical errors

### Commit Message Style
Conventional Commits (feat:, fix:, docs:)

## AI Platform Preferences

### Preferred Platforms (for this project)
1. Claude Web
2. Doubao Web
3. ChatGPT Web

### Model Selection
Balance between speed and quality

## Work Style

### Interaction Mode
Proceed autonomously with best practices - 写好代码，测试好，我只要结果

### Documentation
Minimal documentation - 只在必要时写文档

### Code Review
Auto-commit with good messages

## Special Instructions

### Do's
- 说中文
- 代码注释用英文
- 保持代码简洁
- 一次性完成所有工作

### Don'ts
- 不要修改已测试的代码（Claude, Doubao）
- 不要创建不必要的文档
- 不要冗长的实现
- 不要重复说明

## Notes

- 中途不要停止，要写完所有代码
- 采用统一的浏览器方案
- 使用 playwright-core 而不是 playwright
```
