import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Download, Trash2, LogOut } from "lucide-react";

const personas = {
  default: "Management Consulting Coach",
  rupaul: "RuPaul",
  cher: "Cher",
  connor: "Connor Wood",
  charlotte: "Charlotte Henderson"
};

const initialGreeting = {
  role: 'assistant',
  content: `Hi there, I'm RUFfie—the Risk Up Front Friendly Intelligence Agent. I evaluate risk statements using the CEI framework: Cause, Effect, Impact. I assign a letter grade from A to D, identify what's structurally missing, and ask one sharp coaching question to move it forward. I don't rewrite risks—but I help you get to clarity faster. You can share a risk—and if you like, name a public figure, and I'll respond in their voice while keeping the CEI standard. I have the greatest enthusiasm and confidence in the mission, and I want to help you.`,
  timestamp: new Date().toISOString(),
  grade: null
};

export default function RUFfieApp() {
  const [user, setUser] = useState(null);
  const [currentRisk, setCurrentRisk] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState('default');
  const [sessionRisks, setSessionRisks] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      setUser({
        name: loginForm.username,
        role: 'Risk Analyst',
        permissions: ['coaching', 'export']
      });
      setShowLogin(false);
      setConversation([initialGreeting]);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
    setConversation([]);
    setSessionRisks([]);
    setCurrentRisk('');
  };

  const coachRisk = async (riskStatement, conversationHistory, selectedPersona) => {
    const systemPrompt = `You are RUFfie (Risk Up Front Friendly Intelligence Engine), an AI coaching assistant specialized in risk assessment using the Cause-Effect-Impact (CEI) framework.

CORE RESPONSIBILITIES:
- Evaluate risks using the CEI framework with grades A, A-, B+, B, B-, C+, C, D
- Always restate the risk exactly as given before analysis
- Parse the risk into Cause → Effect → Impact structure
- Provide specific coaching to improve clarity and actionability
- Never rewrite risks - coach users to improve them themselves

GRADING RUBRIC:
- Grade A: Fully structured, highly specific, voiced, and actionable
- Grade A-: Structured + specific, missing minor quantification details
- Grade B+: Well-structured, almost actionable, lacks sharpness
- Grade B: Clearly structured, needs precision in details
- Grade B-: Barely structured, still vague in parts
- Grade C+: Almost structured but not quite there
- Grade C: Vague, confused, or misaligned structure
- Grade D: Just a concern, no CEI structure

PERSONA INSTRUCTIONS:
${selectedPersona === 'default' ? 'Use the tone and reasoning style of Ezra Klein - structured, inquisitive, reflective, and analytically precise.' : ''}
${selectedPersona === 'rupaul' ? 'Channel RuPaul\'s energy while maintaining CEI rigor: "Structure is eleganza. Now make it specific." Use glamour and discipline.' : ''}
${selectedPersona === 'cher' ? 'Use Cher\'s direct, no-nonsense approach: "You\'ve got a maybe when I need a milestone." Cut through wishy-washy hedging.' : ''}
${selectedPersona === 'connor' ? 'Mirror Connor Wood\'s chaotic energy for vibe-based risks: "Oh my god. Just vibes. No plan." Then carve through the chaos.' : ''}
${selectedPersona === 'charlotte' ? 'Use Charlotte Henderson\'s organizational dysfunction expertise: "So we all knew this deadline was coming... and no one did anything?"' : ''}

COACHING PROCESS:
1. Restate the risk exactly as given
2. Diagram it: Cause → [present condition] Effect → [future consequence] Impact → [business cost]
3. Assign grade and explain why
4. Ask targeted coaching questions to improve specificity
5. If risk reaches B+ or higher, offer to generate the structured template

Remember: Every joke must carry a structural point. Every persona response must advance CEI clarity.`;

    // Only send role and content to API
    const apiMessages = conversationHistory
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1500,
          messages: [
            { role: "user", content: systemPrompt },
            ...apiMessages,
            { role: "user", content: `Please coach this risk statement: "${riskStatement}"` }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content && data.content[0] && data.content[0].text
        ? data.content[0].text
        : "⚠️ No response from Claude.";
    } catch (error) {
      console.error("Error in risk coaching:", error);
      throw error;
    }
  };

  const handleSubmitRisk = async (e) => {
    e.preventDefault();
    if (!currentRisk.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: currentRisk,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentRisk('');
    setIsLoading(true);

    try {
      const coaching = await coachRisk(currentRisk, conversation, persona);

      const gradeMatch = coaching.match(/Grade:?\s*([A-D][+-]?)/i);
      const grade = gradeMatch ? gradeMatch[1] : null;

      const assistantMessage = {
        role: 'assistant',
        content: coaching,
        timestamp: new Date().toISOString(),
        grade: grade
      };

      setConversation(prev => [...prev, assistantMessage]);

      if (grade && ['A', 'A-', 'B+'].includes(grade)) {
        const newRisk = {
          id: sessionRisks.length + 1,
          statement: currentRisk,
          grade: grade,
          timestamp: new Date().toISOString(),
          submittedBy: user.name
        };
        setSessionRisks(prev => [...prev, newRisk]);
      }

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I'm experiencing technical difficulties. Error: ${error.message}. Please check your API configuration and try again.`,
        timestamp: new Date().toISOString(),
        grade: null
      };
      setConversation(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const exportRisks = () => {
    const csvData = sessionRisks.map(risk => [
      risk.id,
      '', // project
      '', // track
      risk.statement,
      '', // effect
      '', // impact
      '', // prioritization
      '', // owner
      '', // mitigations
      risk.submittedBy,
      new Date(risk.timestamp).toISOString().split('T')[0],
      '', // notes
      risk.grade
    ].join(','));

    const headers = [
      'Risk Number', 'Project', 'Track', 'Cause', 'Effect', 'Impact',
      'Prioritization', 'Owner', 'Mitigations', 'Submitted By',
      'Date Submitted', 'Notes', 'Final Grade'
    ].join(',');

    const csv = [headers, ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `ruffie-risks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearSession = () => {
    setConversation([initialGreeting]);
    setSessionRisks([]);
    setCurrentRisk('');
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RUFfie</h1>
            <p className="text-gray-600">Risk Up Front Friendly Intelligence Engine</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={loginForm.username}
                onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={loginForm.password}
                onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={!loginForm.username || !loginForm.password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Access RUFfie
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Corporate Risk Management Platform
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">RUFfie</h1>
              <span className="ml-3 text-sm text-gray-500">Risk Coaching Session</span>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={persona}
                onChange={e => setPersona(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Object.entries(personas).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
              <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-gray-900" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-2 rounded-full ${message.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-gray-600 mr-3'}`}>
                    {message.role === 'user'
                      ? <User size={16} className="text-white" />
                      : <Bot size={16} className="text-white" />}
                  </div>
                  <div className={`rounded-lg p-4 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    {message.grade && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${['A', 'A-'].includes(message.grade) ? 'bg-green-100 text-green-800' : ['B+', 'B', 'B-'].includes(message.grade) ? 'bg-yellow-100 text-yellow-800' : ['C+', 'C'].includes(message.grade) ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                          Grade: {message.grade}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl">
                  <div className="bg-gray-600 p-2 rounded-full mr-3">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border shadow-sm rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>
          <div className="border-t bg-white p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={currentRisk}
                  onChange={e => setCurrentRisk(e.target.value)}
                  placeholder="Describe your risk statement here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  disabled={isLoading}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (currentRisk.trim() && !isLoading) {
                        handleSubmitRisk(e);
                      }
                    }
                  }}
                />
              </div>
              <button
                onClick={handleSubmitRisk}
                disabled={!currentRisk.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send size={16} />
                <span>Coach</span>
              </button>
            </div>
          </div>
        </div>
        <div className="w-80 border-l bg-white p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Session Controls</h3>
              <div className="space-y-2">
                <button
                  onClick={clearSession}
                  className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Clear Session</span>
                </button>
                {sessionRisks.length > 0 && (
                  <button
                    onClick={exportRisks}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Export Risks</span>
                  </button>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">{`Session Risks (${sessionRisks.length})`}</h3>
              {sessionRisks.length === 0 ? (
                <p className="text-gray-500 text-sm">Risks graded B+ or higher will appear here</p>
              ) : (
                <div className="space-y-3">
                  {sessionRisks.map(risk => (
                    <div key={risk.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-600">{`Risk #${risk.id}`}</span>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${['A', 'A-'].includes(risk.grade) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {risk.grade}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{risk.statement}</p>
                      <div className="mt-2 text-xs text-gray-500">{new Date(risk.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Session Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-900">{conversation.filter(m => m.role === 'user').length}</div>
                  <div className="text-gray-600">Submissions</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-900">{sessionRisks.length}</div>
                  <div className="text-gray-600">Quality Risks</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
