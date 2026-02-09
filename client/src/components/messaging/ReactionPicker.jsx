import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ReactionPicker.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionPicker = ({ onSelectEmoji, onClose, position }) => {
    return (
        <>
            <div className="reaction-picker-overlay" onClick={onClose} />
            <motion.div
                className="reaction-picker"
                style={{ top: position.y, left: position.x }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
            >
                {EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        className="emoji-btn"
                        onClick={() => {
                            onSelectEmoji(emoji);
                            onClose();
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </motion.div>
        </>
    );
};

export default ReactionPicker;
