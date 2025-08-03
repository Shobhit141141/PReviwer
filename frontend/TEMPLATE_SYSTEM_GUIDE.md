# PR Analysis Template System - Quick Start Guide

## 🎯 Overview

The new Template System allows users to create dynamic system prompts using placeholder variables that automatically populate with actual PR data. This enables personalized and contextual AI analysis reports.

## 🚀 Key Features

### 1. **Template Variables**

Users can include dynamic content using `{{variable_name}}` syntax:

- `{{title}}` - PR title
- `{{description}}` - PR description
- `{{author}}` - PR author name
- `{{state}}` - PR state (open/closed/merged)
- `{{files_changed}}` - Number of files changed
- `{{additions}}` - Lines added
- `{{deletions}}` - Lines deleted
- `{{commits}}` - Number of commits
- `{{branch_source}}` - Source branch
- `{{branch_target}}` - Target branch
- `{{created_at}}` - Creation date
- `{{updated_at}}` - Last update date

### 2. **Smart UI Integration**

- **Variable Autocomplete**: Shows available variables when typing `{{`
- **Real-time Preview**: See how your template will look with sample data
- **Validation**: Highlights invalid variables and suggests corrections
- **Quick Templates**: Pre-built templates for common analysis types

### 3. **Enhanced Analysis**

- **Contextual Prompts**: Templates automatically adapt to PR characteristics
- **Flexible Focus**: Create templates for security, performance, or general analysis
- **Consistent Results**: Standardized prompt structure across different PRs

## 🛠️ How to Use

### Basic Template Example:

```
Analyze this PR titled "{{title}}" by {{author}}.
It's currently {{state}} and affects {{files_changed}} files.
```

### Advanced Template Example:

```
**PR Analysis Request**

Title: {{title}}
Author: {{author}}
Status: {{state}}
Scope: {{files_changed}} files, {{additions}} additions, {{deletions}} deletions

{{description}}

Please provide:
1. Security assessment
2. Code quality review
3. Performance implications
4. Recommendations for improvement
```

## 🎨 UI Features

### Variable Suggestions

- **Search & Filter**: Find variables quickly
- **One-click Insert**: Add variables with a single click


## 📈 Benefits

### For Users:

- **Consistency**: Same prompt structure across different PRs
- **Efficiency**: No need to manually enter PR details
- **Flexibility**: Customize analysis focus while maintaining structure
- **Accuracy**: Automatic data population eliminates typos

### For Development:

- **Maintainable**: Centralized template management
- **Extensible**: Easy to add new variables
- **Testable**: Preview functionality for template validation
- **Scalable**: Template sharing and reuse capabilities

## 🎯 Use Cases

### Security-Focused Template:

```
SECURITY ANALYSIS for {{title}}

PR by {{author}} modifying {{files_changed}} files.
Branch: {{branch_source}} → {{branch_target}}

{{description}}

Focus on:
- Authentication/authorization changes
- Input validation
- Sensitive data handling
- Potential vulnerabilities
```

### Performance Review Template:

```
PERFORMANCE IMPACT ANALYSIS

{{title}} ({{state}})
Changes: {{additions}}+ {{deletions}}- across {{files_changed}} files

{{description}}

Evaluate:
- Database query optimization
- Memory usage implications
- Response time impact
- Scalability considerations
```

### Code Quality Template:

```
CODE QUALITY REVIEW: {{title}}

Author: {{author}}
Commits: {{commits}}
Files: {{files_changed}}

{{description}}

Assess:
- Code structure and organization
- Best practices adherence
- Documentation quality
- Test coverage
- Maintainability
```

## 🔄 Migration Guide

### From Static Prompts:

1. **Identify Dynamic Content**: Look for parts of your prompt that change per PR
2. **Replace with Variables**: Substitute with appropriate `{{variable}}` syntax
3. **Test & Validate**: Use preview to ensure correct rendering
4. **Deploy**: Use the new templated analysis endpoint

### Example Migration:

**Before:**

```
Analyze this pull request. Look at the files and provide feedback.
```

**After:**

```
Analyze PR "{{title}}" by {{author}}.
It modifies {{files_changed}} files with {{additions}} additions.

{{description}}

Provide detailed feedback on code quality and security.
```

## 🚀 Getting Started

1. **Access Playground**: Go to the enhanced playground page
2. **Switch to Templates**: Click on "Template System" tab
3. **Create Template**: Use the editor with variable suggestions
4. **Preview**: See how your template renders with sample data
5. **Generate**: Create analysis reports using your template

Start with the quick templates and customize them for your needs!

## 📞 Support

- Check the documentation in `/src/docs/TEMPLATE_SYSTEM.md` for detailed API reference
- Use the test script at `/src/tests/template-system-test.js` for examples
- Template validation provides real-time feedback for troubleshooting
