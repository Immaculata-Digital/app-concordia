import { useState, useRef, useEffect } from "react";
import { Box, Typography, IconButton, Toolbar, Paper } from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link,
  Code,
} from "@mui/icons-material";
import "./style.css";

type WYSIWYGpickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
};

const WYSIWYGpicker = ({
  label,
  value = "",
  onChange,
  fullWidth = false,
  placeholder = "Digite seu texto aqui...",
  disabled = false,
  required = false,
  error = false,
  helperText,
}: WYSIWYGpickerProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    handleInput();
  };

  const isCommandActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  return (
    <Box
      className={`wysiwyg-picker ${
        fullWidth ? "wysiwyg-picker--full-width" : ""
      }`}
    >
      {label && (
        <Typography
          variant="body2"
          className={`wysiwyg-picker__label ${
            required ? "wysiwyg-picker__label--required" : ""
          } ${error ? "wysiwyg-picker__label--error" : ""}`}
          component="label"
        >
          {label}
          {required && <span className="wysiwyg-picker__required"> *</span>}
        </Typography>
      )}
      <Paper
        variant="outlined"
        className={`wysiwyg-picker__container ${
          isFocused ? "wysiwyg-picker__container--focused" : ""
        } ${error ? "wysiwyg-picker__container--error" : ""} ${
          disabled ? "wysiwyg-picker__container--disabled" : ""
        }`}
      >
        <Toolbar className="wysiwyg-picker__toolbar" disableGutters>
          <IconButton
            size="small"
            onClick={() => execCommand("bold")}
            disabled={disabled}
            color={isCommandActive("bold") ? "primary" : "default"}
            title="Negrito"
          >
            <FormatBold fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => execCommand("italic")}
            disabled={disabled}
            color={isCommandActive("italic") ? "primary" : "default"}
            title="Itálico"
          >
            <FormatItalic fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => execCommand("underline")}
            disabled={disabled}
            color={isCommandActive("underline") ? "primary" : "default"}
            title="Sublinhado"
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
          <Box className="wysiwyg-picker__divider" />
          <IconButton
            size="small"
            onClick={() => execCommand("insertUnorderedList")}
            disabled={disabled}
            color={
              isCommandActive("insertUnorderedList") ? "primary" : "default"
            }
            title="Lista com marcadores"
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => execCommand("insertOrderedList")}
            disabled={disabled}
            color={isCommandActive("insertOrderedList") ? "primary" : "default"}
            title="Lista numerada"
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => execCommand("formatBlock", "<blockquote>")}
            disabled={disabled}
            title="Citação"
          >
            <FormatQuote fontSize="small" />
          </IconButton>
          <Box className="wysiwyg-picker__divider" />
          <IconButton
            size="small"
            onClick={() => {
              const url = prompt("Digite a URL:");
              if (url) execCommand("createLink", url);
            }}
            disabled={disabled}
            title="Inserir link"
          >
            <Link fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => execCommand("formatBlock", "<pre>")}
            disabled={disabled}
            title="Código"
          >
            <Code fontSize="small" />
          </IconButton>
        </Toolbar>
        <Box
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="wysiwyg-picker__editor"
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </Paper>
      {helperText && (
        <Typography
          variant="caption"
          className={`wysiwyg-picker__helper ${
            error ? "wysiwyg-picker__helper--error" : ""
          }`}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default WYSIWYGpicker;

