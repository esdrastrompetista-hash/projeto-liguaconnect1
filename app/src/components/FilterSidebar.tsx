import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterOptions {
  nativeLanguage: string;
  learningLanguage: string;
  gender: string;
}

interface FilterSidebarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const LANGUAGES = [
  'Todos os idiomas',
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Italiano',
  'Japonês',
  'Mandarim',
  'Russo',
  'Coreano',
  'Árabe'
];

const GENDERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' }
];

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      nativeLanguage: 'todos',
      learningLanguage: 'todos',
      gender: 'todos'
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-4 border-0 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>

        {/* Native Language */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs text-slate-400 uppercase tracking-wide">
            Idioma Nativo
          </Label>
          <Select 
            value={localFilters.nativeLanguage} 
            onValueChange={(value) => handleChange('nativeLanguage', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os idiomas" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang.toLowerCase().replace(/\s/g, '-')}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Learning Language */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs text-slate-400 uppercase tracking-wide">
            Está Aprendendo
          </Label>
          <Select 
            value={localFilters.learningLanguage} 
            onValueChange={(value) => handleChange('learningLanguage', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os idiomas" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang.toLowerCase().replace(/\s/g, '-')}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs text-slate-400 uppercase tracking-wide">
            Gênero
          </Label>
          <Select 
            value={localFilters.gender} 
            onValueChange={(value) => handleChange('gender', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </Card>
    </motion.div>
  );
}
