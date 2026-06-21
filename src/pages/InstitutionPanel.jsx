import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, Settings, MonitorPlay, LogOut, BookOpen,
  Search, Plus, Trash2, MapPin, CheckCircle,
  Bell, Megaphone, Pencil, X, UploadCloud,
  FileText, Lock, TrendingUp, Palette, Image as ImageIcon,
  Globe, Key, Building, DoorOpen, ShieldAlert, RefreshCw
} from "lucide-react"

import LogoAllTech from "../assets/logotipo_alltech_solutions_icon.png"

// ==================================================================
// CONFIGURAÇÕES GLOBAIS E DADOS ESTÁTICOS (Fora do Componente)
// ==================================================================
const MOCK_SCHOOLS = [
  {
    id: "mock-basic", name: "Teste - Basic", email: "teste@basic.com", password: "123456",
    plan: "Basic", status: "Ativo", classes: [], studentsList: [], exits: ["Portão Principal"]
  },
  {
    id: "mock-premium", name: "Teste - Premium", email: "teste@premium.com", password: "123456",
    plan: "Premium", status: "Ativo", classes: [], studentsList: [], exits: ["Portão Principal", "Portão Sul"]
  },
  {
    id: "mock-diamond", name: "Teste - Diamond", email: "teste@diamond.com", password: "123456",
    plan: "Diamond", status: "Ativo", classes: [], studentsList: [], exits: ["Portão Principal", "Portão VIP"]
  }
];

const DEFAULT_PRIMARY_COLOR = '#f97316';   // Laranja AllTech
const DEFAULT_SECONDARY_COLOR = '#3b82f6'; // Azul AllTech

export default function InstitutionPanel() {
  // ==================================================================
  // SEÇÃO 1: REFS E NAVEGAÇÃO (Hooks de referência)
  // ==================================================================
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==================================================================
  // SEÇÃO 2: ESTADOS GLOBAIS E DE SESSÃO
  // ==================================================================
  const [school, setSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("monitor");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("@SmartExit:darkMode") === "true";
  });

  // ==================================================================
  // SEÇÃO 3: ESTADOS DAS FUNCIONALIDADES (Telas)
  // ==================================================================

  // --- 3.1 Identidade Visual (Whitelabel) ---
  const [tempPrimaryColor, setTempPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [tempSecondaryColor, setTempSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);

  // --- 3.2 Gestão de Portões ---
  const [gatesList, setGatesList] = useState([]);
  const [editingGateId, setEditingGateId] = useState(null);
  const [gateFormName, setGateFormName] = useState("");
  const [gateFormTime, setGateFormTime] = useState("");
  const [gateFormIsDefault, setGateFormIsDefault] = useState(false);
  const [gateFormSelectedClasses, setGateFormSelectedClasses] = useState([]);
  const [newExitName, setNewExitName] = useState(""); // Saídas simples legadas

  // --- 3.3 Gestão de Turmas ---
  const [classFormName, setClassFormName] = useState("");
  const [classFormExit, setClassFormExit] = useState("");
  const [editingClassId, setEditingClassId] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [bulkClassExitOption, setBulkClassExitOption] = useState("");

  // --- 3.4 Gestão de Alunos ---
  const [studentFormName, setStudentFormName] = useState("");
  const [studentFormGrade, setStudentFormGrade] = useState("");
  const [studentFormExit, setStudentFormExit] = useState("");
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkStudentExitOption, setBulkStudentExitOption] = useState("");
  const [bulkStudentGradeOption, setBulkStudentGradeOption] = useState("");

  // --- 3.5 Monitor de Saída ---
  const [monitorSearch, setMonitorSearch] = useState("");
  const [selectedExitFilter, setSelectedExitFilter] = useState("Todos");
  const [calledStudents, setCalledStudents] = useState([]);
  const [callExits, setCallExits] = useState({});

  // ==================================================================
  // SEÇÃO 4: EFEITOS DE CICLO DE VIDA (useEffect)
  // Regra do React: Todos os hooks devem ficar antes do primeiro `return`
  // ==================================================================

  // 4.1 Carregamento Inicial (Autenticação e Dados)
  useEffect(() => {
    let allSchools = JSON.parse(localStorage.getItem("@SmartExit:schools"));
    if (!allSchools || allSchools.length === 0) {
      allSchools = MOCK_SCHOOLS;
      localStorage.setItem("@SmartExit:schools", JSON.stringify(allSchools));
    }

    const loggedSchool = JSON.parse(localStorage.getItem("@SmartExit:loggedSchool"));
    if (!loggedSchool) {
      navigate("/login");
    } else {
      let loadedClasses = loggedSchool.classes || [];
      if (loadedClasses.length > 0 && typeof loadedClasses[0] === 'string') {
        loadedClasses = loadedClasses.map((c, i) => ({ id: Date.now() + i, name: c, defaultExit: loggedSchool.exits?.[0] || "" }));
      }

      setSchool({
        ...loggedSchool,
        studentsList: loggedSchool.studentsList || [],
        exits: loggedSchool.exits || [],
        classes: loadedClasses
      });
    }
  }, [navigate]);

  // 4.2 Sincroniza cores do banco com os inputs visuais temporários
  useEffect(() => {
    if (school) {
      setTempPrimaryColor(school.primaryColor || DEFAULT_PRIMARY_COLOR);
      setTempSecondaryColor(school.secondaryColor || DEFAULT_SECONDARY_COLOR);
    }
  }, [school?.primaryColor, school?.secondaryColor]);

  // 4.3 Carrega Portões do Banco
  useEffect(() => {
    if (school?.id) {
      const savedGates = localStorage.getItem(`@SmartExit:gates:${school.id}`);
      if (savedGates) setGatesList(JSON.parse(savedGates));
    }
  }, [school?.id]);

  // 4.4 Salva Portões no Banco sempre que a lista for alterada
  useEffect(() => {
    if (school?.id) {
      localStorage.setItem(`@SmartExit:gates:${school.id}`, JSON.stringify(gatesList));
    }
  }, [gatesList, school?.id]);

  // 4.5 Aplica o Dark Mode na raiz do HTML (classe 'dark')
  useEffect(() => {
    localStorage.setItem("@SmartExit:darkMode", isDarkMode);
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // 4.6 Carrega lista de alunos que já foram chamados na sessão
  useEffect(() => {
    if (school?.id) {
      const savedCalls = JSON.parse(localStorage.getItem(`@SmartExit:called:${school.id}`)) || [];
      setCalledStudents(savedCalls);
    }
  }, [school?.id]);

  // ==================================================================
  // SEÇÃO 5: BARREIRA DE PROTEÇÃO (Early Return)
  // ATENÇÃO: NENHUM hook (useState, useEffect, useRef) pode existir abaixo desta linha!
  // ==================================================================
  if (!school) return null;

  // ==================================================================
  // SEÇÃO 6: FUNÇÕES E REGRAS DE NEGÓCIO (Handlers)
  // ==================================================================

  // --- Funções Globais e do Sistema ---
  function saveSchoolData(updatedSchool) {
    setSchool(updatedSchool);
    localStorage.setItem("@SmartExit:loggedSchool", JSON.stringify(updatedSchool));
    const allSchools = JSON.parse(localStorage.getItem("@SmartExit:schools")) || [];
    const updatedSchools = allSchools.map(s => s.id === updatedSchool.id ? updatedSchool : s);
    localStorage.setItem("@SmartExit:schools", JSON.stringify(updatedSchools));
  }

  function handleLogout() {
    localStorage.removeItem("@SmartExit:loggedSchool");
    navigate("/login");
  }

  function handleResetSystem() {
    if (window.confirm("🚨 ATENÇÃO: Isso vai apagar TODAS as turmas, alunos e portões de TODOS os perfis. O sistema voltará ao estado original de fábrica. Tem certeza?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  // --- Funções de Whitelabel (Cores e Logo) ---
  const handleSaveColors = () => {
    const updatedSchool = {
      ...school,
      primaryColor: tempPrimaryColor,
      secondaryColor: tempSecondaryColor
    };

    setSchool(updatedSchool);

    // Salva no banco de todas as instituições
    const savedInstitutions = JSON.parse(localStorage.getItem("institutions") || "[]");
    const updatedInstitutions = savedInstitutions.map(inst =>
      inst.id === updatedSchool.id ? updatedSchool : inst
    );
    localStorage.setItem("institutions", JSON.stringify(updatedInstitutions));

    // Salva na sessão atual também
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser && currentUser.id === updatedSchool.id) {
      localStorage.setItem("currentUser", JSON.stringify(updatedSchool));
    }

    // Salva no MOCK principal
    saveSchoolData(updatedSchool);
    alert("Cores salvas com sucesso!");
  };

  const handleResetColors = () => {
    setTempPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setTempSecondaryColor(DEFAULT_SECONDARY_COLOR);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => saveSchoolData({ ...school, customLogo: event.target.result });
    reader.readAsDataURL(file);
  };

  const triggerLogoUpload = () => {
    if (logoInputRef.current) logoInputRef.current.click();
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    saveSchoolData({ ...school, customLogo: null });
  };

  const handleLanguageChange = (e) => saveSchoolData({ ...school, language: e.target.value });

  const handleGenerateApiKey = () => {
    if (window.confirm("Gerar uma nova chave de API invalidará a chave anterior. Deseja continuar?")) {
      const randomKey = "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      saveSchoolData({ ...school, apiKey: randomKey });
    }
  };

  // --- Gestão de Portões ---
  const handleSubmitGate = (e) => {
    e.preventDefault();
    const gateData = {
      id: editingGateId || Date.now().toString(),
      name: gateFormName,
      time: gateFormTime,
      defaultClasses: gateFormIsDefault ? gateFormSelectedClasses : []
    };

    if (editingGateId) setGatesList(gatesList.map(g => g.id === editingGateId ? gateData : g));
    else setGatesList([...gatesList, gateData]);

    const updatedClasses = school.classes.map(c => {
      if (gateFormIsDefault && gateFormSelectedClasses.includes(c.name)) return { ...c, defaultExit: gateFormName };
      if (editingGateId && c.defaultExit === gateFormName && (!gateFormIsDefault || !gateFormSelectedClasses.includes(c.name))) return { ...c, defaultExit: "" };
      return c;
    });

    const updatedStudents = school.studentsList.map(student => {
      if (gateFormIsDefault && gateFormSelectedClasses.includes(student.grade)) return { ...student, defaultExit: gateFormName };
      return student;
    });

    saveSchoolData({ ...school, classes: updatedClasses, studentsList: updatedStudents });

    setEditingGateId(null);
    setGateFormName("");
    setGateFormTime("");
    setGateFormIsDefault(false);
    setGateFormSelectedClasses([]);
  };

  const handleEditGateClick = (gate) => {
    setEditingGateId(gate.id);
    setGateFormName(gate.name);
    setGateFormTime(gate.time);
    setGateFormIsDefault(gate.defaultClasses.length > 0);
    setGateFormSelectedClasses(gate.defaultClasses || []);
  };

  const handleDeleteGate = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este portão?")) {
      setGatesList(gatesList.filter(g => g.id !== id));
    }
  };

  function handleAddExit(e) {
    e.preventDefault();
    if (!newExitName) return;
    saveSchoolData({ ...school, exits: [...school.exits, newExitName] });
    setNewExitName("");
  }

  function handleRemoveExit(exitToRemove) {
    saveSchoolData({ ...school, exits: school.exits.filter(e => e !== exitToRemove) });
    if (selectedExitFilter === exitToRemove) setSelectedExitFilter("Todos");
  }

  // --- Gestão de Turmas ---
  function handleSubmitClass(e) {
    e.preventDefault();
    if (!classFormName) return;

    let updatedClasses;
    let updatedStudentsList = [...school.studentsList];

    if (editingClassId) {
      const oldClass = school.classes.find(c => c.id === editingClassId);
      updatedClasses = school.classes.map(c => c.id === editingClassId ? { ...c, name: classFormName, defaultExit: classFormExit } : c);
      updatedStudentsList = updatedStudentsList.map(student => {
        if (student.grade === oldClass.name) return { ...student, grade: classFormName, defaultExit: classFormExit };
        return student;
      });
    } else {
      const newClass = { id: Date.now(), name: classFormName, defaultExit: classFormExit };
      updatedClasses = [...school.classes, newClass];
    }

    saveSchoolData({ ...school, classes: updatedClasses, studentsList: updatedStudentsList });
    handleCancelClassEdit();
  }

  function handleEditClassClick(cls) {
    setClassFormName(cls.name);
    setClassFormExit(cls.defaultExit || "");
    setEditingClassId(cls.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelClassEdit() {
    setClassFormName("");
    setClassFormExit("");
    setEditingClassId(null);
  }

  function handleRemoveClass(id) {
    const updatedClasses = school.classes.filter(c => c.id !== id);
    saveSchoolData({ ...school, classes: updatedClasses });
    setSelectedClasses(prev => prev.filter(cId => cId !== id));
  }

  function handleToggleClass(id) {
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  }

  function handleToggleAllClasses(e) {
    if (e.target.checked) setSelectedClasses(school.classes.map(c => c.id));
    else setSelectedClasses([]);
  }

  function handleApplyBulkClassChanges() {
    if (!bulkClassExitOption || selectedClasses.length === 0) return;
    const updatedClasses = school.classes.map(c => selectedClasses.includes(c.id) ? { ...c, defaultExit: bulkClassExitOption } : c);
    const classNamesUpdated = updatedClasses.filter(c => selectedClasses.includes(c.id)).map(c => c.name);
    const updatedStudentsList = school.studentsList.map(s => {
      if (classNamesUpdated.includes(s.grade)) return { ...s, defaultExit: bulkClassExitOption };
      return s;
    });

    saveSchoolData({ ...school, classes: updatedClasses, studentsList: updatedStudentsList });
    setSelectedClasses([]);
    setBulkClassExitOption("");
  }

  // --- Gestão de Alunos ---
  function handleStudentGradeChange(e) {
    const selectedClassName = e.target.value;
    setStudentFormGrade(selectedClassName);
    const classObj = school.classes.find(c => c.name === selectedClassName);
    if (classObj && classObj.defaultExit) setStudentFormExit(classObj.defaultExit);
  }

  function handleSubmitStudent(e) {
    e.preventDefault();
    if (!studentFormName || !studentFormGrade) return;
    let updatedStudentsList;

    if (editingStudentId) {
      updatedStudentsList = school.studentsList.map(s => s.id === editingStudentId ? { ...s, name: studentFormName, grade: studentFormGrade, defaultExit: studentFormExit || school.exits[0] } : s);
    } else {
      updatedStudentsList = [...school.studentsList, { id: Date.now(), name: studentFormName, grade: studentFormGrade, defaultExit: studentFormExit || school.exits[0] || "Portão Principal" }];
    }

    saveSchoolData({ ...school, studentsList: updatedStudentsList, students: updatedStudentsList.length });
    handleCancelStudentEdit();
  }

  function handleEditStudentClick(student) {
    setStudentFormName(student.name);
    setStudentFormGrade(student.grade);
    setStudentFormExit(student.defaultExit);
    setEditingStudentId(student.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelStudentEdit() {
    setStudentFormName("");
    setStudentFormGrade("");
    setStudentFormExit("");
    setEditingStudentId(null);
  }

  function handleRemoveStudent(id) {
    const updatedList = school.studentsList.filter(s => s.id !== id);
    saveSchoolData({ ...school, studentsList: updatedList, students: updatedList.length });
    setSelectedStudents(prev => prev.filter(selectedId => selectedId !== id));
  }

  function handleToggleStudent(id) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  }

  function handleToggleAllStudents(e) {
    if (e.target.checked) setSelectedStudents(school.studentsList.map(s => s.id));
    else setSelectedStudents([]);
  }

  function handleApplyBulkStudentChanges() {
    if ((!bulkStudentExitOption && !bulkStudentGradeOption) || selectedStudents.length === 0) return;

    const updatedStudentsList = school.studentsList.map(s => {
      if (selectedStudents.includes(s.id)) {
        let newGrade = bulkStudentGradeOption || s.grade;
        let newExit = bulkStudentExitOption || s.defaultExit;

        if (bulkStudentGradeOption && !bulkStudentExitOption) {
          const classObj = school.classes.find(c => c.name === bulkStudentGradeOption);
          if (classObj) newExit = classObj.defaultExit;
        }
        return { ...s, grade: newGrade, defaultExit: newExit };
      }
      return s;
    });

    saveSchoolData({ ...school, studentsList: updatedStudentsList });
    setSelectedStudents([]);
    setBulkStudentExitOption("");
    setBulkStudentGradeOption("");
  }

  // --- Importação em Lote (CSV) ---
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const newStudents = [];
      const newClasses = [];
      let studentsAddedCount = 0;
      let classesAddedCount = 0;

      const existingClasses = [...school.classes];
      const existingStudents = [...school.studentsList];

      lines.forEach((line, index) => {
        if (!line.trim() || (index === 0 && line.toLowerCase().includes("nome"))) return;

        const columns = line.split(/[;,]/);
        const name = columns[0] ? columns[0].trim() : "";
        const grade = columns[1] ? columns[1].trim() : "";

        let classObj = null;
        if (grade) {
          classObj = existingClasses.find(c => c.name.toLowerCase() === grade.toLowerCase()) || newClasses.find(c => c.name.toLowerCase() === grade.toLowerCase());
          if (!classObj) {
            classObj = { id: Date.now() + Math.random(), name: grade, defaultExit: school.exits[0] || "Portão Principal" };
            newClasses.push(classObj);
            classesAddedCount++;
          }
        }

        if (name) {
          const isDuplicate = existingStudents.some(s => s.name === name) || newStudents.some(s => s.name === name);
          if (!isDuplicate) {
            const defaultExit = classObj ? classObj.defaultExit : (school.exits[0] || "Portão Principal");
            newStudents.push({ id: Date.now() + Math.random(), name: name, grade: grade || "", defaultExit: defaultExit });
            studentsAddedCount++;
          }
        }
      });

      if (newStudents.length > 0 || newClasses.length > 0) {
        const updatedClasses = [...school.classes, ...newClasses];
        const updatedStudentsList = [...school.studentsList, ...newStudents];
        saveSchoolData({ ...school, classes: updatedClasses, studentsList: updatedStudentsList, students: updatedStudentsList.length });
        alert(`✅ Importação concluída com sucesso!\n\n📊 Resumo:\n- ${studentsAddedCount} novos alunos.\n- ${classesAddedCount} novas turmas.`);
      } else {
        alert("Nenhum dado novo encontrado para importar.");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file, "windows-1252");
  }

  // --- Monitor de Saída ---
  function handleCallStudent(student) {
    if (!calledStudents.find(s => s.id === student.id)) {
      const exitToUse = callExits[student.id] || student.defaultExit || school.exits[0] || "Portão Principal";
      const newCall = {
        ...student,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitGate: exitToUse
      };
      const updatedCalls = [newCall, ...calledStudents];
      setCalledStudents(updatedCalls);
      localStorage.setItem(`@SmartExit:called:${school.id}`, JSON.stringify(updatedCalls));
    }
  }

  function handleDismissStudent(id) {
    const updatedCalls = calledStudents.filter(s => s.id !== id);
    setCalledStudents(updatedCalls);
    localStorage.setItem(`@SmartExit:called:${school.id}`, JSON.stringify(updatedCalls));
  }

  // ==================================================================
  // SEÇÃO 7: ESTILOS CALCULADOS E INJEÇÃO DE CSS
  // ==================================================================
  const customStyles = {
    '--color-primary': (school?.plan === "Premium" || school?.plan === "Diamond") && school?.primaryColor ? school.primaryColor : DEFAULT_PRIMARY_COLOR,
    '--color-secondary': (school?.plan === "Premium" || school?.plan === "Diamond") && school?.secondaryColor ? school.secondaryColor : DEFAULT_SECONDARY_COLOR,
  };

  // ==================================================================
  // SEÇÃO 8: RENDER (JSX)
  // ==================================================================
  return (
    <div style={customStyles} className="min-h-screen flex bg-[#f4f7fb] dark:bg-darkbg transition-colors">
      
      {/* ========================================== */}
      {/* MENU LATERAL (SIDEBAR) */}
      {/* ========================================== */}
      <aside className="w-64 bg-white dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-[#2a2a2a] flex flex-col shadow-sm z-10 transition-colors">
        {/* LOGO E NOME */}
        <div className="p-6 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center gap-3">
          {school.plan !== "Basic" && school.customLogo ? (
            <img src={school.customLogo} alt="Logo da Escola" className="max-h-10 w-auto shrink-0 rounded-full" />
          ) : (
            <img src={LogoAllTech} alt="AllTech Solutions" className="w-10 h-10 object-contain shrink-0" />
          )}

          <div className="overflow-hidden">
            <h2 className="font-bold text-slate-900 dark:text-white leading-tight truncate" title={school.plan !== "Basic" && school.name ? school.name : "AllTech Solutions"}>
              {school.plan !== "Basic" && school.name ? school.name : "AllTech Solutions"}
            </h2>
            <p className="text-xs font-semibold uppercase text-primary">Plano {school.plan}</p>
          </div>
        </div>

        {/* LINKS DO MENU */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "monitor", icon: MonitorPlay, label: "Monitor de Saída" },
            { id: "students", icon: Users, label: "Gestão de Alunos" },
            { id: "classes", icon: BookOpen, label: "Gestão de Turmas" },
            { id: "gates", icon: DoorOpen, label: "Gestão de Portões" },
            { id: "import", icon: UploadCloud, label: "Importar Dados" },
            { id: "reports", icon: FileText, label: "Relatórios Avançados", locked: school.plan === "Basic" },
            { id: "fleet", icon: MapPin, label: 'Rotas & "Estou Chegando"', locked: school.plan === "Basic" || school.plan === "Premium" },
            { id: "settings", icon: Settings, label: "Configurações" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${
                activeTab === item.id 
                ? "bg-primary text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#2a2a2a]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.locked && <Lock size={16} className="text-slate-400 dark:text-slate-500" />}
            </button>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-100 dark:border-[#2a2a2a]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-medium transition">
            <LogOut size={20} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ------------------------------------------ */}
        {/* ABA: MONITOR DE SAÍDA */}
        {/* ------------------------------------------ */}
        {activeTab === "monitor" && (
          <div className="p-8 flex-1 flex flex-col h-full overflow-hidden">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Monitor de Saída</h1>
                <p className="text-slate-500">Controle a liberação dos alunos em tempo real.</p>
              </div>
              <button onClick={() => window.open('/tv', '_blank')} className="bg-primary text-white hover:opacity-90 px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                <MonitorPlay size={18} /> Abrir Telão (TV)
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar aluno ou turma..." value={monitorSearch} onChange={(e) => setMonitorSearch(e.target.value)} className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] dark:text-white rounded-xl py-3 pl-12 pr-4 outline-none transition" />
              </div>
              <select value={selectedExitFilter} onChange={(e) => setSelectedExitFilter(e.target.value)} className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3 outline-none font-medium text-slate-700 dark:text-slate-200 transition">
                <option value="Todos">Filtrar por Portão: Todos</option>
                {school.exits.map(exit => <option key={exit} value={exit}>{exit}</option>)}
              </select>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
              {/* Alunos Disponíveis */}
              <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Alunos Disponíveis</span>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{school.studentsList.length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                  {school.studentsList
                    .filter(s => s.name.toLowerCase().includes(monitorSearch.toLowerCase()) || s.grade.toLowerCase().includes(monitorSearch.toLowerCase()))
                    .filter(s => selectedExitFilter === "Todos" || s.defaultExit === selectedExitFilter)
                    .map(student => (
                      <div key={student.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] border border-slate-100 dark:border-[#2a2a2a] rounded-xl transition">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{student.grade} • Padrão: {student.defaultExit || "Não definido"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Sair por:</span>
                            <select
                              value={callExits[student.id] || student.defaultExit || (school.exits[0] || "")}
                              onChange={(e) => setCallExits(prev => ({ ...prev, [student.id]: e.target.value }))}
                              className="text-xs bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#333333] text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer w-32"
                            >
                              {school.exits.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                            </select>
                          </div>
                          <button onClick={() => handleCallStudent(student)} className="bg-primary text-white hover:opacity-90 h-10 px-4 rounded-lg font-bold transition flex items-center gap-2 mt-3 shadow-sm">
                            <Megaphone size={16} /> Chamar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Fila de Chamada */}
              <div className="w-96 bg-[#020817] dark:bg-black rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-800 dark:border-[#2a2a2a]">
                <div className="p-5 border-b border-slate-800 dark:border-[#2a2a2a] flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Bell className="text-primary" size={20} /> Fila de Chamada
                  </h3>
                  <span className="bg-primary text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{calledStudents.length}</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                  {calledStudents.map(student => (
                    <div key={student.id} className="bg-slate-800/50 dark:bg-[#1a1a1a] border border-slate-700 dark:border-[#2a2a2a] p-4 rounded-xl animate-pulse">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white text-lg leading-tight">{student.name}</p>
                          <p className="text-slate-400 text-sm">{student.grade} • <span className="text-primary">{student.exitGate}</span></p>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-900 dark:bg-black px-2 py-1 rounded-md">{student.time}</span>
                      </div>
                      <button onClick={() => handleDismissStudent(student.id)} className="w-full mt-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 py-2 rounded-lg font-bold transition flex justify-center items-center gap-2 text-sm">
                        <CheckCircle size={16} /> Confirmar Saída
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: GESTÃO DE TURMAS */}
        {/* ------------------------------------------ */}
        {activeTab === "classes" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Turmas</h1>
              <p className="text-slate-500">Cadastre, edite as séries e defina os portões padrão delas.</p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition-colors ${editingClassId ? 'border-secondary bg-slate-50 dark:bg-slate-900/50' : 'bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'} max-w-3xl`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${editingClassId ? 'text-secondary' : 'text-slate-800 dark:text-white'}`}>
                  {editingClassId ? <Pencil size={20} className="text-secondary" /> : <BookOpen size={20} className="text-primary" />}
                  {editingClassId ? "Editando Turma" : "Cadastrar Nova Turma"}
                </h3>
                {editingClassId && (
                  <button onClick={handleCancelClassEdit} className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-sm font-bold bg-white dark:bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333]">
                    <X size={16} /> Cancelar Edição
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitClass} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Turma</label>
                  <input type="text" required value={classFormName} onChange={e => setClassFormName(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="Ex: 1º Ano B" />
                </div>

                <div className="w-64">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Saída Padrão da Turma</label>
                  <select value={classFormExit} onChange={e => setClassFormExit(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white">
                    <option value="" disabled>Selecione...</option>
                    {school.exits.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>

                <button type="submit" className={`font-bold px-6 py-3 rounded-xl transition shadow-lg text-white hover:opacity-90 ${editingClassId ? 'bg-secondary' : 'bg-primary'}`}>
                  {editingClassId ? "Salvar" : "Adicionar"}
                </button>
              </form>
            </div>

            <div className="max-w-3xl space-y-2">
              {school.classes.map(cls => (
                <div key={cls.id} className={`flex justify-between items-center p-4 border rounded-xl transition-colors ${editingClassId === cls.id ? 'border-secondary bg-slate-50 dark:bg-slate-900/50' : 'bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'}`}>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{cls.name}</p>
                    <p className="text-sm text-slate-500">Saída Padrão: <span className="font-semibold text-slate-600 dark:text-slate-400">{cls.defaultExit || "Não definida"}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClassClick(cls)} className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition"><Pencil size={20} /></button>
                    <button onClick={() => handleRemoveClass(cls.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {school.classes.length === 0 && (
                <p className="text-center text-slate-500 py-4 text-sm">Nenhuma turma cadastrada.</p>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: GESTÃO DE ALUNOS */}
        {/* ------------------------------------------ */}
        {activeTab === "students" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Alunos</h1>
              <p className="text-slate-500">Cadastre os alunos e vincule-os às suas respectivas turmas.</p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition-colors ${editingStudentId ? 'border-secondary bg-slate-50 dark:bg-slate-900/50' : 'bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${editingStudentId ? 'text-secondary' : 'text-slate-800 dark:text-white'}`}>
                  {editingStudentId ? <Pencil size={20} className="text-secondary" /> : <Plus size={20} className="text-primary" />}
                  {editingStudentId ? "Editando Aluno" : "Cadastrar Novo Aluno"}
                </h3>
                {editingStudentId && <button onClick={handleCancelStudentEdit} className="text-slate-500 hover:text-red-500 text-sm font-bold bg-white dark:bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333]">Cancelar</button>}
              </div>

              <form onSubmit={handleSubmitStudent} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                  <input type="text" required value={studentFormName} onChange={e => setStudentFormName(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white" />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Turma</label>
                  <select required value={studentFormGrade} onChange={handleStudentGradeChange} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white">
                    <option value="" disabled>Selecione...</option>
                    {school.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="w-48">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Saída Padrão</label>
                  <select value={studentFormExit} onChange={e => setStudentFormExit(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white">
                    <option value="" disabled>Selecione...</option>
                    {school.exits.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
                <button type="submit" className={`font-bold py-3 px-6 rounded-xl transition shadow-lg text-white hover:opacity-90 ${editingStudentId ? 'bg-secondary' : 'bg-primary'}`}>
                  {editingStudentId ? "Salvar" : "Adicionar"}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden mb-8">
              <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <input type="checkbox" onChange={handleToggleAllStudents} checked={school.studentsList.length > 0 && selectedStudents.length === school.studentsList.length} className="w-4 h-4 cursor-pointer accent-primary" />
                  <span>Alunos Cadastrados</span>
                </div>
                <span className="bg-slate-200 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{school.studentsList.length}</span>
              </div>

              {selectedStudents.length > 0 && (
                <div className="p-3 px-4 flex justify-between items-center border-b border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#2a2a2a]">
                  <span className="font-bold text-sm text-primary">{selectedStudents.length} selecionado(s)</span>
                  <div className="flex gap-2 items-center">
                    <select value={bulkStudentGradeOption} onChange={e => setBulkStudentGradeOption(e.target.value)} className="text-sm border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-white rounded-lg px-3 py-2 outline-none">
                      <option value="">Nova Turma (Opcional)...</option>
                      {school.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={bulkStudentExitOption} onChange={e => setBulkStudentExitOption(e.target.value)} className="text-sm border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-white rounded-lg px-3 py-2 outline-none">
                      <option value="">Nova Saída (Opcional)...</option>
                      {school.exits.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    <button onClick={handleApplyBulkStudentChanges} disabled={!bulkStudentExitOption && !bulkStudentGradeOption} className={`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm text-white ${(!bulkStudentExitOption && !bulkStudentGradeOption) ? 'bg-slate-400 dark:bg-slate-600' : 'bg-primary hover:opacity-90'}`}>
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {school.studentsList.map(student => (
                  <div key={student.id} className={`p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#2a2a2a] ${selectedStudents.includes(student.id) ? 'bg-slate-50 dark:bg-[#2a2a2a]' : ''}`}>
                    <div className="flex items-center gap-4">
                      <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleToggleStudent(student.id)} className="w-4 h-4 cursor-pointer accent-primary" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.grade} • Saída: <span className="font-semibold text-slate-600 dark:text-slate-400">{student.defaultExit}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditStudentClick(student)} className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-[#333333] rounded-lg transition"><Pencil size={20} /></button>
                      <button onClick={() => handleRemoveStudent(student.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: GESTÃO DE PORTÕES */}
        {/* ------------------------------------------ */}
        {activeTab === "gates" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Portões</h1>
              <p className="text-slate-500">Cadastre os locais de saída e defina os horários de liberação.</p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition-colors ${editingGateId ? 'border-secondary bg-slate-50 dark:bg-slate-900/50' : 'bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${editingGateId ? 'text-secondary' : 'text-slate-800 dark:text-white'}`}>
                  {editingGateId ? <Pencil size={20} className="text-secondary" /> : <Plus size={20} className="text-primary" />}
                  {editingGateId ? "Editando Portão" : "Cadastrar Novo Portão"}
                </h3>
                {editingGateId && (
                  <button
                    onClick={() => {
                      setEditingGateId(null);
                      setGateFormName("");
                      setGateFormTime("");
                      setGateFormIsDefault(false);
                      setGateFormSelectedClasses([]);
                    }}
                    className="text-slate-500 hover:text-red-500 text-sm font-bold bg-white dark:bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333] transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitGate} className="flex flex-col gap-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Portão / Local</label>
                    <input
                      type="text"
                      placeholder="Ex: Portão Principal"
                      required
                      value={gateFormName}
                      onChange={e => setGateFormName(e.target.value)}
                      className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white transition-colors"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Horário Padrão</label>
                    <input
                      type="time"
                      required
                      value={gateFormTime}
                      onChange={e => setGateFormTime(e.target.value)}
                      className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white transition-colors"
                    />
                  </div>
                  <button type="submit" className={`h-[50px] font-bold px-8 rounded-xl transition shadow-lg text-white hover:opacity-90 ${editingGateId ? 'bg-secondary' : 'bg-primary'}`}>
                    {editingGateId ? "Salvar" : "Adicionar"}
                  </button>
                </div>

                <div className="mt-2 pt-4 border-t border-slate-200/60 dark:border-[#2a2a2a]">
                  <label className="flex items-center gap-3 cursor-pointer w-max">
                    <input
                      type="checkbox"
                      checked={gateFormIsDefault}
                      onChange={(e) => setGateFormIsDefault(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tornar este portão a saída padrão de turmas específicas</span>
                  </label>

                  {gateFormIsDefault && (
                    <div className="mt-4 p-4 border rounded-xl border-primary bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-primary">Selecione as turmas vinculadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {school.classes.map(c => (
                          <label key={c.id} className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] px-3 py-2 rounded-lg cursor-pointer hover:border-primary transition shadow-sm">
                            <input
                              type="checkbox"
                              value={c.name}
                              checked={gateFormSelectedClasses.includes(c.name)}
                              onChange={(e) => {
                                if (e.target.checked) setGateFormSelectedClasses([...gateFormSelectedClasses, c.name]);
                                else setGateFormSelectedClasses(gateFormSelectedClasses.filter(name => name !== c.name));
                              }}
                              className="w-3.5 h-3.5 accent-primary"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden mb-8">
              <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <DoorOpen size={18} className="text-slate-400" />
                  <span>Portões Cadastrados</span>
                </div>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{gatesList.length}</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {gatesList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    Nenhum portão cadastrado. Adicione o primeiro portão acima.
                  </div>
                ) : (
                  gatesList.map(gate => (
                    <div key={gate.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-primary">
                          <DoorOpen size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{gate.name}</p>
                          <p className="text-sm text-slate-500">
                            Horário: <span className="font-semibold text-slate-600 dark:text-slate-400">{gate.time}</span> • Padrão para: <span className="text-slate-600 dark:text-slate-400">{gate.defaultClasses.length > 0 ? gate.defaultClasses.join(', ') : 'Nenhuma turma'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditGateClick(gate)} className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-[#333333] rounded-lg transition"><Pencil size={20} /></button>
                        <button onClick={() => handleDeleteGate(gate.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={20} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: IMPORTAÇÃO MASSIVA */}
        {/* ------------------------------------------ */}
        {activeTab === "import" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Importação em Lote</h1>
              <p className="text-slate-500">Cadastre centenas de alunos de uma vez usando uma planilha CSV.</p>
            </div>

            <div className="max-w-2xl bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-primary rounded-full flex items-center justify-center mb-6">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Importar Arquivo CSV</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                Salve sua planilha do Excel no formato <strong>CSV (separado por vírgulas)</strong>.
                O arquivo precisa ter duas colunas: <strong>Nome</strong> e <strong>Turma</strong>.
              </p>

              <div className="w-full bg-slate-50 dark:bg-[#1a1a1a] border-2 border-dashed border-slate-300 dark:border-[#333333] rounded-2xl p-8 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:border-primary transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Clique para escolher seu arquivo CSV"
                />
                <UploadCloud size={40} className="text-slate-400 mx-auto mb-3" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Clique para selecionar ou arraste o arquivo aqui</p>
                <p className="text-sm text-slate-500 mt-1">Apenas arquivos .csv</p>
              </div>

              <div className="mt-8 text-left w-full bg-slate-100 dark:bg-[#2a2a2a] p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-white mb-2">💡 Dica de Ouro:</p>
                <p>Se as turmas que estiverem na planilha já existirem aqui no sistema, os alunos herdarão o portão de saída delas automaticamente!</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: RELATÓRIOS AVANÇADOS */}
        {/* ------------------------------------------ */}
        {activeTab === "reports" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios Avançados</h1>
              <p className="text-slate-500">Análise de fluxo, horários de pico e frequência dos alunos.</p>
            </div>

            {school.plan === "Basic" ? (
              <div className="max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm p-10 flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Funcionalidade Exclusiva do Plano Premium</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                  Sua instituição está no plano <span className="font-bold text-slate-700 dark:text-slate-300">Basic</span>. Faça o upgrade hoje mesmo para ter acesso a relatórios detalhados de auditoria de saídas, gráficos de desempenho de portões e histórico completo de chamadas.
                </p>
                <button className="bg-primary text-white hover:opacity-90 font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition shadow-sm">
                  <TrendingUp size={20} /> Falar com Suporte & Mudar de Plano
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-slate-300">
                📊 Em breve: Gráficos e inteligência de dados da sua instituição aqui.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: ROTAS E ESTOU CHEGANDO */}
        {/* ------------------------------------------ */}
        {activeTab === "fleet" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rotas & "Estou Chegando"</h1>
              <p className="text-slate-500">Sincronização em tempo real com vans escolares e geolocalização de responsáveis.</p>
            </div>

            {(school.plan === "Basic" || school.plan === "Premium") ? (
              <div className="max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm p-10 flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Funcionalidade Exclusiva do Plano Diamond</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                  Eleve o nível da segurança. Com o plano <span className="font-bold text-slate-700 dark:text-slate-300">Diamond</span>, sua escola ganha integração com o app dos pais para organizar a fila da chamada antes mesmo deles chegarem no portão, além da gestão completa de vans parceiras.
                </p>
                <button className="bg-primary text-white hover:opacity-90 font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition shadow-sm">
                  <TrendingUp size={20} /> Dar um Upgrade para o Diamond
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-slate-300">
                🚌 Em breve: Painel de monitoramento de aproximação dos pais e cadastro de frotas.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* ABA: CONFIGURAÇÕES */}
        {/* ------------------------------------------ */}
        {activeTab === "settings" && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações do Sistema</h1>
              <p className="text-slate-500">Gerencie as preferências e a identidade visual da sua instituição.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* 1. DADOS DA INSTITUIÇÃO */}
              <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Building size={20} className="text-primary" />
                  Dados Cadastrais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nome da Escola</label>
                    <input type="text" disabled value={school.name} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block mb-1">E-mail de Contato</label>
                    <input type="text" disabled value={school.email} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">* Para alterar dados sensíveis, contate o suporte.</p>
              </div>

              {/* 2. PERSONALIZAÇÃO DE MARCA (WHITELABEL) */}
              <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden flex flex-col">
                {school.plan === "Basic" && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-center p-6 border border-white/20">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary mb-3 shadow-sm">
                      <Lock size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Personalização Exclusiva</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mb-4">Insira o logotipo da sua escola e mude as cores fazendo um upgrade para o plano Premium.</p>
                    <button className="bg-primary text-white hover:opacity-90 font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow-sm">
                      Fazer Upgrade Agora
                    </button>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Palette size={20} className="text-primary" />
                      Identidade Visual (Whitelabel)
                    </h3>
                    {school.plan !== "Basic" && <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">Premium</span>}
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8">
                    {/* Bloco do Logotipo */}
                    <div className="flex-1 space-y-4">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block">Logotipo da Instituição</label>
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                      <div
                        onClick={triggerLogoUpload}
                        className="relative border-2 border-dashed border-slate-200 dark:border-[#333333] rounded-xl h-36 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] hover:border-primary transition cursor-pointer overflow-hidden group"
                      >
                        {school?.customLogo ? (
                          <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-[#2a2a2a] shadow-md overflow-hidden">
                            <img src={school.customLogo} alt="Logo da Escola" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }} className="text-white hover:text-red-400 transition p-2">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-sm font-medium">Clique para enviar</span>
                            <span className="text-xs">PNG ou JPG redondo</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bloco das Cores */}
                    <div className="flex-1 space-y-4">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block">Cores do Sistema</label>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Principal</span>
                            <div className="flex items-center gap-2">
                              <input type="color" value={tempPrimaryColor} onChange={(e) => setTempPrimaryColor(e.target.value)} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed" />
                              <input type="text" maxLength={7} value={tempPrimaryColor} onChange={(e) => setTempPrimaryColor(e.target.value)} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300 font-mono uppercase outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Secundária</span>
                            <div className="flex items-center gap-2">
                              <input type="color" value={tempSecondaryColor} onChange={(e) => setTempSecondaryColor(e.target.value)} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed" />
                              <input type="text" maxLength={7} value={tempSecondaryColor} onChange={(e) => setTempSecondaryColor(e.target.value)} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300 font-mono uppercase outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveColors} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Salvar
                          </button>
                          <button onClick={handleResetColors} disabled={school?.plan !== "Premium" && school?.plan !== "Diamond"} className="bg-slate-100 dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#333333] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Restaurar Padrão
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CONFIGURAÇÕES GLOBAIS E API */}
              <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden flex flex-col">
                {["Basic", "Premium"].includes(school.plan) && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-center p-6 border border-white/20">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white mb-3 shadow-sm">
                      <Lock size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Integração e Automação Diamond</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mb-4">Acesse APIs, webhooks e idiomas secundários com o plano Diamond.</p>
                    <button className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition">
                      Ver Vantagens do Diamond
                    </button>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Globe size={20} className="text-slate-700 dark:text-slate-400" />
                      Avançado & Integrações
                    </h3>
                    {school.plan === "Diamond" && <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Diamond</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block mb-2">Idioma do Sistema</label>
                      <select value={school.language || "Português (BR)"} onChange={handleLanguageChange} className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333333] rounded-xl p-3 text-slate-700 dark:text-slate-300 outline-none focus:border-primary">
                        <option value="Português (BR)">Português (BR)</option>
                        <option value="English (US)">English (US)</option>
                        <option value="Español (ES)">Español (ES)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block mb-2 flex items-center gap-2">
                        <Key size={16} /> Chave de API
                      </label>
                      <div className="flex">
                        <input type="text" value={school.apiKey || "Nenhuma chave gerada"} disabled className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333333] border-r-0 rounded-l-xl p-3 text-slate-500 font-mono text-sm" />
                        <button onClick={handleGenerateApiKey} className="bg-slate-200 dark:bg-[#2a2a2a] hover:bg-slate-300 dark:hover:bg-[#333333] text-slate-700 dark:text-white px-4 rounded-r-xl font-semibold transition text-sm">
                          Gerar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. BLOCO DE DARK MODE */}
              <div className="p-6 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl flex flex-col justify-center">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Palette size={20} className="text-primary" />
                      Aparência do Painel
                    </h3>
                    <p className="text-sm text-slate-500">Alternar entre o tema claro e escuro.</p>
                  </div>

                  {school.plan === "Basic" ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] rounded-lg text-slate-400 cursor-not-allowed">
                      <Lock size={16} />
                      <span className="text-sm font-semibold">Exclusivo Premium</span>
                    </div>
                  ) : (
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-[#333333]'}`}>
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* 5. DANGER ZONE: RESET DE FÁBRICA */}
              <div className="p-6 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-2xl col-span-2 mt-4">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
                  <ShieldAlert size={20} />
                  Zona de Perigo
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                  Atenção: Ao resetar o sistema, você apagará permanentemente todos os alunos, turmas e portões cadastrados. O sistema voltará a ter apenas os 3 perfis iniciais de teste.
                </p>
                <button onClick={handleResetSystem} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition">
                  <RefreshCw size={18} />
                  Resetar Sistema
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}