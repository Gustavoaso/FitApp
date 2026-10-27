-- ============================================================
-- CURADORIA DA BASE DE EXERCÍCIOS
-- ============================================================
-- is_curado marca o que o motor pode sugerir (RN14). Começa false,
-- como em base_alimentos: exercício importado só entra depois de revisto.
-- Ficam fora (pelo id_externo do free-exercise-db, categoria original):
-- levantamento olímpico, alongamento, strongman e rolo de espuma
-- (liberação miofascial classificada como exercício).
-- Exercícios sem id_externo vêm do seed curado à mão e entram.
-- ============================================================

alter table public.base_exercicios
  add column is_curado boolean not null default false;

create index idx_base_exercicios_curado on public.base_exercicios (is_curado) where is_curado;

update public.base_exercicios
set is_curado = id_externo is null or id_externo <> all (array[
  '90_90_Hamstring', 'Adductor', 'Adductor_Groin', 'All_Fours_Quad_Stretch', 'Ankle_Circles',
  'Ankle_On_The_Knee', 'Anterior_Tibialis-SMR', 'Arm_Circles', 'Atlas_Stone_Trainer',
  'Atlas_Stones', 'Axle_Deadlift', 'Backward_Drag', 'Bear_Crawl_Sled_Drags',
  'Behind_Head_Chest_Stretch', 'Brachialis-SMR', 'Calf_Stretch_Elbows_Against_Wall',
  'Calf_Stretch_Hands_Against_Wall', 'Calves-SMR', 'Car_Deadlift', 'Cat_Stretch',
  'Chair_Leg_Extended_Stretch', 'Chair_Lower_Back_Stretch', 'Chair_Upper_Body_Stretch',
  'Chest_And_Front_Of_Shoulder_Stretch', 'Chest_Stretch_on_Stability_Ball', 'Childs_Pose',
  'Chin_To_Chest_Stretch', 'Circus_Bell', 'Clean', 'Clean_Deadlift', 'Clean_Pull', 'Clean_Shrug',
  'Clean_and_Jerk', 'Clean_from_Blocks', 'Conans_Wheel', 'Crossover_Reverse_Lunge', 'Crucifix',
  'Dancers_Stretch', 'Dynamic_Back_Stretch', 'Dynamic_Chest_Stretch', 'Elbow_Circles',
  'Elbows_Back', 'Farmers_Walk', 'Foot-SMR', 'Forward_Drag_with_Press', 'Frankenstein_Squat',
  'Frog_Hops', 'Front_Leg_Raises', 'Groin_and_Back_Stretch', 'Groiners', 'Hamstring-SMR',
  'Hamstring_Stretch', 'Hang_Clean', 'Hang_Clean_-_Below_the_Knees', 'Hang_Snatch',
  'Hang_Snatch_-_Below_Knees', 'Heaving_Snatch_Balance', 'Hip_Circles_prone', 'Hug_A_Ball',
  'Hug_Knees_To_Chest', 'IT_Band_and_Glute_Stretch', 'Iliotibial_Tract-SMR', 'Inchworm',
  'Intermediate_Groin_Stretch', 'Intermediate_Hip_Flexor_and_Quad_Stretch', 'Iron_Crosses_stretch',
  'Jerk_Balance', 'Jerk_Dip_Squat', 'Keg_Load', 'Knee_Across_The_Body', 'Knee_Circles',
  'Kneeling_Forearm_Stretch', 'Kneeling_Hip_Flexor', 'Kneeling_Jump_Squat', 'Latissimus_Dorsi-SMR',
  'Leg-Up_Hamstring_Stretch', 'Log_Lift', 'Looking_At_Ceiling', 'Lower_Back-SMR',
  'Lower_Back_Curl', 'Lying_Bent_Leg_Groin', 'Lying_Crossover', 'Lying_Glute', 'Lying_Hamstring',
  'Lying_Prone_Quadriceps', 'Middle_Back_Stretch', 'Muscle_Snatch', 'Neck-SMR', 'Olympic_Squat',
  'On-Your-Back_Quad_Stretch', 'On_Your_Side_Quad_Stretch', 'One_Arm_Against_Wall',
  'One_Half_Locust', 'One_Handed_Hang', 'One_Knee_To_Chest', 'Overhead_Lat', 'Overhead_Squat',
  'Overhead_Stretch', 'Overhead_Triceps', 'Pelvic_Tilt_Into_Bridge', 'Peroneals-SMR',
  'Peroneals_Stretch', 'Piriformis-SMR', 'Posterior_Tibialis_Stretch', 'Power_Clean_from_Blocks',
  'Power_Jerk', 'Power_Snatch', 'Power_Snatch_from_Blocks', 'Power_Stairs', 'Push_Press',
  'Push_Press_-_Behind_the_Neck', 'Pyramid', 'Quad_Stretch', 'Quadriceps-SMR', 'Rack_Delivery',
  'Rear_Leg_Raises', 'Rhomboids-SMR', 'Rickshaw_Carry', 'Rickshaw_Deadlift',
  'Romanian_Deadlift_from_Deficit', 'Round_The_World_Shoulder_Stretch', 'Runners_Stretch',
  'Sandbag_Load', 'Scissor_Kick', 'Seated_Biceps', 'Seated_Calf_Stretch',
  'Seated_Floor_Hamstring_Stretch', 'Seated_Front_Deltoid', 'Seated_Glute', 'Seated_Hamstring',
  'Seated_Hamstring_and_Calf_Stretch', 'Seated_Overhead_Stretch', 'Shoulder_Circles',
  'Shoulder_Raise', 'Shoulder_Stretch', 'Side-Lying_Floor_Stretch', 'Side_Leg_Raises',
  'Side_Lying_Groin_Stretch', 'Side_Neck_Stretch', 'Side_Wrist_Pull', 'Sit_Squats',
  'Sled_Drag_-_Harness', 'Sled_Push', 'Snatch', 'Snatch_Balance', 'Snatch_Deadlift',
  'Snatch_Shrug', 'Snatch_from_Blocks', 'Spinal_Stretch', 'Split_Clean', 'Split_Jerk',
  'Split_Snatch', 'Split_Squats', 'Standing_Biceps_Stretch', 'Standing_Elevated_Quad_Stretch',
  'Standing_Gastrocnemius_Calf_Stretch', 'Standing_Hamstring_and_Calf_Stretch',
  'Standing_Hip_Circles', 'Standing_Hip_Flexors', 'Standing_Lateral_Stretch',
  'Standing_Pelvic_Tilt', 'Standing_Soleus_And_Achilles_Stretch', 'Standing_Toe_Touches',
  'Stomach_Vacuum', 'Superman', 'The_Straddle', 'Tire_Flip', 'Toe_Touchers', 'Torso_Rotation',
  'Tricep_Side_Stretch', 'Triceps_Stretch', 'Upper_Back-Leg_Grab', 'Upper_Back_Stretch',
  'Upward_Stretch', 'Wide_Stance_Stiff_Legs', 'Windmills', 'Worlds_Greatest_Stretch',
  'Wrist_Circles', 'Yoke_Walk'
]);
