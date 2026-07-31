import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ChevronLeft, ChevronRight, CheckSquare, Square, GripVertical } from 'lucide-react-native';

interface DailyTask {
  id: string;
  title: string;
  category: 'meal' | 'workout' | 'hydration' | 'supplement';
  completed: boolean;
  time: string;
}

export default function TodoScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [tasks, setTasks] = useState<DailyTask[]>([
    { id: '1', title: 'Drink 500ml water after waking up', category: 'hydration', completed: true, time: '07:00' },
    { id: '2', title: 'Eat High Protein Breakfast', category: 'meal', completed: true, time: '08:00' },
    { id: '3', title: 'Chest & Triceps Workout Session', category: 'workout', completed: false, time: '17:00' },
    { id: '4', title: 'Post-workout Whey & Creatine', category: 'supplement', completed: false, time: '18:30' },
    { id: '5', title: 'Dinner & Evening Stretch Routine', category: 'meal', completed: false, time: '20:00' },
  ]);

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const getCategoryColor = (category: DailyTask['category']) => {
    switch (category) {
      case 'meal':
        return '#34C759';
      case 'workout':
        return '#FF9500';
      case 'hydration':
        return '#64D2FF';
      case 'supplement':
        return '#BF5AF2';
    }
  };

  const renderTaskItem = ({ item }: { item: DailyTask }) => {
    const categoryColor = getCategoryColor(item.category);

    return (
      <View style={styles.taskCard}>
        <TouchableOpacity style={styles.dragHandle}>
          <GripVertical color={Colors.dark.border} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => toggleTaskCompleted(item.id)}
        >
          {item.completed ? (
            <CheckSquare color={Colors.dark.primary} size={24} />
          ) : (
            <Square color={Colors.dark.textSecondary} size={24} />
          )}
        </TouchableOpacity>

        <View style={styles.taskDetails}>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted,
            ]}
          >
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor + '20', borderColor: categoryColor },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.taskTime}>{item.time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily To-Do List</Text>
      </View>

      {/* Date Switcher */}
      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(-1)}>
          <ChevronLeft color={Colors.dark.primary} size={22} />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(1)}>
          <ChevronRight color={Colors.dark.primary} size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '800',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  dateArrow: {
    padding: 6,
  },
  dateText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 12,
  },
  taskCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  dragHandle: {
    paddingRight: 10,
  },
  checkboxTouch: {
    paddingRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.dark.textSecondary,
    opacity: 0.7,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskTime: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
});
