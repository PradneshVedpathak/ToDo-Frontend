import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { getTodayString } from '../utils/dateUtils';
import { scheduleLocalNotification, cancelAllScheduled } from '../utils/notifications';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string | null;
  dueTime: string | null;
  priority: 'low' | 'medium' | 'high';
  scheduledDate: string;
  isDaily: boolean;
  completedDates: string[];
  completedAt: string | null;
  movedFromDate: string | null;
  createdAt: string;
}

interface TodoContextType {
  todos: Todo[];
  pendingPrevious: Todo[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  showPendingModal: boolean;
  setSelectedDate: (date: string) => void;
  setShowPendingModal: (show: boolean) => void;
  fetchTodos: (date?: string) => Promise<void>;
  createTodo: (data: Partial<Todo>) => Promise<void>;
  updateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  moveToToday: (ids: string[]) => Promise<void>;
  clearError: () => void;
}

const TodoContext = createContext<TodoContextType | null>(null);



export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pendingPrevious, setPendingPrevious] = useState<Todo[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const appState = useRef(AppState.currentState);

  const fetchTodos = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const d = date || selectedDate;
      const data = await api.getTodos(d);
      setTodos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const checkPendingTasks = useCallback(async () => {
    try {
      const pending = await api.getPendingPrevious();
      if (pending.length > 0) {
        setPendingPrevious(pending);
        setShowPendingModal(true);
      }
    } catch (err) {
      // Background process: Fail silently in production
    }
  }, []);

  useEffect(() => {
    fetchTodos(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    checkPendingTasks();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchTodos(selectedDate);
        checkPendingTasks();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [selectedDate]);

  const createTodo = async (data: Partial<Todo>) => {
    setError(null);
    try {
      const scheduledDate = data.scheduledDate || selectedDate;
      const newTodo = await api.createTodo({ ...data, scheduledDate });
      
      // Schedule notification if dueTime exists
      if (newTodo.dueTime && !newTodo.completed && Platform.OS !== 'web') {
        const trigger = new Date(`${newTodo.scheduledDate}T${newTodo.dueTime}:00`);
        await scheduleLocalNotification(newTodo.title, `Time to: ${newTodo.title}`, trigger);
      }
      
      setTodos(prev => [newTodo, ...prev]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTodo = async (id: string, data: Partial<Todo>) => {
    setError(null);
    try {
      const updated = await api.updateTodo(id, data);
      
      // Handle notifications
      if (Platform.OS !== 'web') {
        if (updated.completed) {
          // Simplification: In a real app we'd cancel the specific ID. 
          // For now, we rely on the fact that completed tasks don't match our trigger logic.
        } else if (updated.dueTime) {
          const trigger = new Date(`${updated.scheduledDate}T${updated.dueTime}:00`);
          await scheduleLocalNotification(updated.title, `Reminder: ${updated.title}`, trigger);
        }
      }
      
      setTodos(prev => prev.map(t => t._id === id ? updated : t));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTodo = async (id: string) => {
    setError(null);
    try {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t._id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleComplete = async (id: string) => {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    
    if (todo.isDaily) {
      // For daily tasks, we toggle per specific date
      await updateTodo(id, { toggleDate: selectedDate } as any);
    } else {
      await updateTodo(id, { completed: !todo.completed });
    }
  };

  const moveToToday = async (ids: string[]) => {
    setError(null);
    try {
      await api.moveToToday(ids);
      setPendingPrevious(prev => prev.filter(t => !ids.includes(t._id)));
      if (selectedDate === getTodayString()) await fetchTodos();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <TodoContext.Provider value={{
      todos, pendingPrevious, selectedDate, loading, error,
      showPendingModal, setSelectedDate, setShowPendingModal,
      fetchTodos, createTodo, updateTodo, deleteTodo, toggleComplete, moveToToday,
      clearError: () => setError(null),
    }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodo must be used within TodoProvider');
  return ctx;
}
