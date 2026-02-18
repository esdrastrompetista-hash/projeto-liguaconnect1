import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Globe, Search } from 'lucide-react';

interface FindPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: {
    language: string;
    minAge: number;
    maxAge: number;
    gender: string;
  }) => void;
}

const LANGUAGES = [
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Italiano',
  'Japonês',
  'Mandarim',
  'Russo',
  'Coreano',
  'Árabe',
  'Português'
];

const GENDERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' }
];

export function FindPartnerModal({ isOpen, onClose, onSearch }: FindPartnerModalProps) {
  const [language, setLanguage] = useState('');
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [gender, setGender] = useState('todos');

  const handleSearch = () => {
    onSearch({
      language,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      gender
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-600" />
            Encontrar Parceiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <Label>Idioma que quero praticar</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Age Range */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Faixa de idade</Label>
              <span className="text-sm text-slate-600">
                {ageRange[0]} - {ageRange[1]} anos
              </span>
            </div>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={13}
              max={80}
              step={1}
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gênero</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue />
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

          {/* Search Button */}
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Procurar Agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
