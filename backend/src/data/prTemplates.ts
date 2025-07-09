export const PR_TEMPLATES = {
  bad: `### Commit Message:
update

### Files Changed:
- \`auth.js\` (modified)
  - additions: 10
  - deletions: 5
  - patch:
    \`\`\`diff
    - const login = () => {}
    + const loginUser = async () => {
    +   // updated logic
    + }
    \`\`\`

### Description:
Fixed some things, I guess. Not sure if this breaks anything. Let me know if it works 🤷‍♂️`,

  good: `### Commit Message:
Refactor: Improve login flow and handle edge cases

### Files Changed:
- \`auth/loginService.ts\` (modified)
  - additions: 48
  - deletions: 20
  - changes: 68
  - patch:
    \`\`\`diff
    - function loginUser(req, res) {
    -   // old callback-based login
    - }
    + export const loginUser = async (req: Request, res: Response) => {
    +   try {
    +     const token = await authService.validateUser(req.body);
    +     res.status(200).json({ token });
    +   } catch (error) {
    +     res.status(401).json({ error: 'Unauthorized' });
    +   }
    + };
    \`\`\`

### Description:
- Replaced callback-based login with async/await
- Added error handling with proper status codes
- Renamed function for clarity`,

  best: `### Commit Message:
✨ Login Service: Refactor, optimize & secure token validation

### Summary:
Comprehensively improved the login flow to meet modern standards and security best practices.

### Files Changed:

1. **\`src/services/loginService.ts\`** (modified)
   - status: modified
   - additions: 58
   - deletions: 23
   - changes: 81
   - patch:
     \`\`\`diff
     - import jwt from 'jsonwebtoken';
     + import jwt, { JwtPayload } from 'jsonwebtoken';

     - const login = (req, res) => { ... }
     + export const login = async (req: Request, res: Response) => {
     +   try {
     +     const { username, password } = req.body;
     +     const user = await UserModel.findOne({ username });
     +     if (!user || !user.validatePassword(password)) {
     +       return res.status(401).json({ error: 'Invalid credentials' });
     +     }
     +     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
     +     res.json({ token });
     +   } catch (err) {
     +     res.status(500).json({ error: 'Internal server error' });
     +   }
     + };
     \`\`\`

2. **\`src/types/user.d.ts\`** (added)
   - status: added
   - additions: 15
   - deletions: 0
   - patch:
     \`\`\`ts
     export interface User {
       id: string;
       username: string;
       passwordHash: string;
       validatePassword: (password: string) => boolean;
     }
     \`\`\`

3. **\`README.md\`** (modified)
   - additions: 12
   - deletions: 2
   - patch:
     \`\`\`diff
     - ## Authentication
     + ## Login API (Updated)

     + ### POST /api/login
     + Request body:
     + \`\`\`json
     + {
     +   "username": "johndoe",
     +   "password": "secure123"
     + }
     + \`\`\`
     \`\`\`

### Additional Notes:
- Integrated TypeScript type definitions
- Improved DX and reduced technical debt
- Covered changes with unit tests (90%+ coverage)
- Future-ready for 2FA and token refresh support
`,
};
