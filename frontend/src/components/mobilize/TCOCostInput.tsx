import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatSpanishNumber, parseSpanishNumber, formatInputValue, formatOnBlur } from '@/lib/numberFormat';

interface TCOCostInputProps {
  title?: string;
  onDemandAsIs: number;
  oneYearOptimized: number;
  threeYearOptimized: number;
  onOnDemandAsIsChange: (value: number) => void;
  onOneYearOptimizedChange: (value: number) => void;
  onThreeYearOptimizedChange: (value: number) => void;
}

/**
 * Parse AWS Calculator CSV and extract Total 12 months cost
 * Located at row 3 (index 2), column C (index 2)
 * Format: "Estimate summary\nUpfront cost,Monthly cost,Total 12 months cost,Currency\n0,XXXX,TOTAL,USD"
 */
function parseAWSCalculatorCSV(csvText: string): number | null {
  try {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Row 3 in the file = index 2 after filtering empty lines
    // Line 0: "Estimate summary"
    // Line 1: "Upfront cost,Monthly cost,Total 12 months cost,Currency"
    // Line 2: "0,20835.55,250026.72,USD"
    if (lines.length < 3) return null;
    const dataLine = lines[2];
    const cols = dataLine.split(',');
    if (cols.length < 3) return null;
    const value = parseFloat(cols[2]);
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

interface CSVUploadButtonProps {
  fieldId: string;
  onValueParsed: (value: number) => void;
}

function CSVUploadButton({ fieldId, onValueParsed }: CSVUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const value = parseAWSCalculatorCSV(text);
      if (value !== null) {
        onValueParsed(value);
        setStatus('ok');
      } else {
        setStatus('error');
      }
      // Reset input so same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        ref={inputRef}
        id={`csv-${fieldId}`}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="text-xs h-7 px-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
      >
        <FileUp className="h-3 w-3 mr-1" />
        Cargar CSV
      </Button>
      {status === 'ok' && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Cargado
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" /> Formato inválido
        </span>
      )}
    </div>
  );
}

export function TCOCostInput({
  title = 'Costos Anuales AWS (USD)',
  onDemandAsIs,
  oneYearOptimized,
  threeYearOptimized,
  onOnDemandAsIsChange,
  onOneYearOptimizedChange,
  onThreeYearOptimizedChange
}: TCOCostInputProps) {
  const [onDemandDisplay, setOnDemandDisplay] = useState<string>(
    onDemandAsIs > 0 ? formatSpanishNumber(onDemandAsIs) : ''
  );
  const [oneYearDisplay, setOneYearDisplay] = useState<string>(
    oneYearOptimized > 0 ? formatSpanishNumber(oneYearOptimized) : ''
  );
  const [threeYearDisplay, setThreeYearDisplay] = useState<string>(
    threeYearOptimized > 0 ? formatSpanishNumber(threeYearOptimized) : ''
  );

  const handleOnDemandChange = (value: string) => {
    const formatted = formatInputValue(value);
    setOnDemandDisplay(formatted);
    onOnDemandAsIsChange(parseSpanishNumber(formatted));
  };

  const handleOnDemandBlur = (value: string) => {
    const formatted = formatOnBlur(value);
    setOnDemandDisplay(formatted);
    onOnDemandAsIsChange(parseSpanishNumber(formatted));
  };

  const handleOneYearChange = (value: string) => {
    const formatted = formatInputValue(value);
    setOneYearDisplay(formatted);
    onOneYearOptimizedChange(parseSpanishNumber(formatted));
  };

  const handleOneYearBlur = (value: string) => {
    const formatted = formatOnBlur(value);
    setOneYearDisplay(formatted);
    onOneYearOptimizedChange(parseSpanishNumber(formatted));
  };

  const handleThreeYearChange = (value: string) => {
    const formatted = formatInputValue(value);
    setThreeYearDisplay(formatted);
    onThreeYearOptimizedChange(parseSpanishNumber(formatted));
  };

  const handleThreeYearBlur = (value: string) => {
    const formatted = formatOnBlur(value);
    setThreeYearDisplay(formatted);
    onThreeYearOptimizedChange(parseSpanishNumber(formatted));
  };

  // Called when CSV is parsed - updates both display and parent state
  const handleCSVValue = (
    value: number,
    setDisplay: (v: string) => void,
    onChange: (v: number) => void
  ) => {
    const formatted = formatSpanishNumber(value);
    setDisplay(formatted);
    onChange(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {/* OnDemand */}
          <div>
            <Label htmlFor="onDemandAsIs" className="text-sm font-medium">
              OnDemand (As-Is Optimizado) *
            </Label>
            <Input
              id="onDemandAsIs"
              type="text"
              value={onDemandDisplay}
              onChange={(e) => handleOnDemandChange(e.target.value)}
              onBlur={(e) => handleOnDemandBlur(e.target.value)}
              placeholder="Ej: 774.346,80"
              className="mt-1"
            />
            <CSVUploadButton
              fieldId="ondemand"
              onValueParsed={(v) => handleCSVValue(v, setOnDemandDisplay, onOnDemandAsIsChange)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Costo anual OnDemand optimizado desde la calculadora AWS
            </p>
          </div>

          {/* 1 Año */}
          <div>
            <Label htmlFor="oneYearOptimized" className="text-sm font-medium">
              1 Año Optimizado (NUSP) *
            </Label>
            <Input
              id="oneYearOptimized"
              type="text"
              value={oneYearDisplay}
              onChange={(e) => handleOneYearChange(e.target.value)}
              onBlur={(e) => handleOneYearBlur(e.target.value)}
              placeholder="Ej: 732.272,88"
              className="mt-1"
            />
            <CSVUploadButton
              fieldId="oneyear"
              onValueParsed={(v) => handleCSVValue(v, setOneYearDisplay, onOneYearOptimizedChange)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Costo anual con Saving Plan de 1 año (No Upfront)
            </p>
          </div>

          {/* 3 Años */}
          <div>
            <Label htmlFor="threeYearOptimized" className="text-sm font-medium">
              3 Años Optimizado (NUSP) *
            </Label>
            <Input
              id="threeYearOptimized"
              type="text"
              value={threeYearDisplay}
              onChange={(e) => handleThreeYearChange(e.target.value)}
              onBlur={(e) => handleThreeYearBlur(e.target.value)}
              placeholder="Ej: 693.749,88"
              className="mt-1"
            />
            <CSVUploadButton
              fieldId="threeyear"
              onValueParsed={(v) => handleCSVValue(v, setThreeYearDisplay, onThreeYearOptimizedChange)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Costo anual con Saving Plan de 3 años (No Upfront)
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Nota:</span> Estos valores se obtienen de la calculadora de AWS proporcionada por el equipo de SWO.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
