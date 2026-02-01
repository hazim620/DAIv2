-- Add bank_info to users (for instructor/teacher payouts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_info TEXT;

-- Discount codes table (instructor-specific, max 25% discount)
CREATE TABLE IF NOT EXISTS discount_codes (
  id VARCHAR(255) PRIMARY KEY,
  instructor_id VARCHAR(255) NOT NULL REFERENCES users(id),
  code VARCHAR(50) NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 25),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instructor_id, code)
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_instructor_id ON discount_codes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
