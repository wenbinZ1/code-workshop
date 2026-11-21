import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';

export function CodeEditor({
  value,
  onChange,
  height = 220,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  readOnly?: boolean;
}) {
  const theme = useResolvedTheme();
  return (
    <div className="code-editor">
      <CodeMirror
        value={value}
        height={`${height}px`}
        theme={theme === 'dark' ? oneDark : 'light'}
        extensions={[python()]}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
}
