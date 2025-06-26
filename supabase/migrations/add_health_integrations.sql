-- Add health integrations table for Apple Health and Google Fit
-- DISABLED: Health integration commented out for web app, keeping for future iOS app conversion
/*
CREATE TABLE IF NOT EXISTS health_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('apple', 'google', 'web')),
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one integration per user per platform
  UNIQUE(user_id, platform)
);

-- Add RLS policies
ALTER TABLE health_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own health integrations
CREATE POLICY "Users can view their own health integrations" ON health_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health integrations" ON health_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health integrations" ON health_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health integrations" ON health_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_health_integrations_user_id ON health_integrations(user_id);
CREATE INDEX idx_health_integrations_platform ON health_integrations(platform);
CREATE INDEX idx_health_integrations_last_sync ON health_integrations(last_sync);

-- Add health metrics table for storing synced data
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES health_integrations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  heart_rate INTEGER,
  steps INTEGER,
  calories INTEGER,
  active_minutes INTEGER,
  sleep_duration DECIMAL(4,2), -- hours
  sleep_quality VARCHAR(20) CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  weight DECIMAL(5,2), -- kg
  body_fat DECIMAL(4,1), -- percentage
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user per date
  UNIQUE(user_id, date)
);

-- Add RLS policies for health metrics
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for health metrics
CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_date ON health_metrics(date);
CREATE INDEX idx_health_metrics_integration_id ON health_metrics(integration_id);

-- Add updated_at trigger for health_integrations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_integrations_updated_at 
  BEFORE UPDATE ON health_integrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_updated_at 
  BEFORE UPDATE ON health_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for demo purposes
INSERT INTO health_integrations (user_id, platform, permissions) 
SELECT 
  id,
  'apple',
  '{"heartRate": true, "steps": true, "calories": true, "sleep": true, "weight": true, "workouts": true}'
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT (user_id, platform) DO NOTHING;
*/ 