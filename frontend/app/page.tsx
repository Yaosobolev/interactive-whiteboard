"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight, Layout } from "lucide-react";

interface BoardInfo {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  objectsCount: number;
}

const BOARDS_LIST_KEY = "whiteboard-boards-list";

const loadBoardsList = (): BoardInfo[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(BOARDS_LIST_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load boards list:", error);
  }
  return [];
};

const saveBoardsList = (boards: BoardInfo[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOARDS_LIST_KEY, JSON.stringify(boards));
  } catch (error) {
    console.error("Failed to save boards list:", error);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function HomePage() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoards(loadBoardsList());
    setIsLoaded(true);
  }, []);

  const createNewBoard = () => {
    const newBoard: BoardInfo = {
      id: generateId(),
      name: `Доска ${boards.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      objectsCount: 0,
    };

    const updatedBoards = [newBoard, ...boards];
    setBoards(updatedBoards);
    saveBoardsList(updatedBoards);

    router.push(`/board/${newBoard.id}`);
  };

  const deleteBoard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("Удалить эту доску?")) return;

    const updatedBoards = boards.filter((b) => b.id !== id);
    setBoards(updatedBoards);
    saveBoardsList(updatedBoards);

    // Удаляем данные доски из localStorage
    localStorage.removeItem(`whiteboard-objects-${id}`);
    localStorage.removeItem(`whiteboard-settings-${id}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Whiteboard
              </h1>
              <p className="text-sm text-gray-500">Интерактивные доски</p>
            </div>
          </div>

          <button
            onClick={createNewBoard}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Новая доска</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {boards.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Layout className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Нет досок
            </h2>
            <p className="text-gray-500 mb-6">
              Создайте первую доску для начала работы
            </p>
            <button
              onClick={createNewBoard}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl transition-colors font-medium"
            >
              <Plus size={20} />
              <span>Создать доску</span>
            </button>
          </div>
        ) : (
          /* Boards grid */
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Ваши доски
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => router.push(`/board/${board.id}`)}
                  className="group bg-white rounded-2xl border border-gray-100 p-5 transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                  style={{
                    boxShadow: 'none',
                    transition: 'all 200ms ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = '#f9fafb';
                    el.style.borderColor = '#d1d5db';
                    el.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = 'white';
                    el.style.borderColor = '#f3f4f6';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Preview area */}
                  <div className="h-32 bg-gray-50 rounded-xl mb-4 flex items-center justify-center">
                    <Layout className="w-8 h-8 text-gray-300" />
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {board.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(board.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => deleteBoard(board.id, e)}
                        className="p-2 text-gray-400 rounded-lg transition-colors cursor-pointer"
                        title="Удалить"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                      <div 
                        className="p-2 text-gray-400 transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                      >
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
