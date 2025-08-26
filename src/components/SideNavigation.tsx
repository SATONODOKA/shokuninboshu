interface SideNavigationProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export default function SideNavigation({ currentSection, onSectionChange }: SideNavigationProps) {
  const sections = [
    { id: 'board', label: '求人ボード', icon: '📋' },
    { id: 'create', label: '新規募集', icon: '➕' },
    { id: 'in-progress', label: '進行中', icon: '🔄' },
    { id: 'completed', label: '完了', icon: '✅' }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">工務店ダッシュボード</h1>
      </div>
      
      <nav className="mt-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              currentSection === section.id 
                ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700 font-semibold' 
                : 'text-gray-700'
            }`}
          >
            <span className="text-lg mr-3">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
}