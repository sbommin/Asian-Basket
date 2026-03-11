// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, Link, useSearchParams } from "react-router-dom";
// import {
//   Edit2,
//   Save,
//   ArrowLeft,
//   ShoppingBag,
//   LogOut,
//   MapPin,
//   Trash2,
//   Plus,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// import {
//   listAddresses,
//   createAddress,
//   deleteAddress,
//   setDefaultAddress,
// } from "@/api/addresses";

// type Address = {
//   id: string;
//   label?: string;
//   full_name?: string;
//   phone?: string;
//   line1: string;
//   line2?: string;
//   city: string;
//   state: string;
//   zip_code: string;
//   country: string;
//   notes?: string;
//   is_default: boolean;
// };

// const Profile = () => {
//   const navigate = useNavigate();
//   const [params] = useSearchParams();
//   const returnTo = params.get("return");

//   const { user, updateUser, logout } = useAuth();
//   const { toast } = useToast();

//   const [editProfile, setEditProfile] = useState(false);
//   const [name, setName] = useState(user?.name || "");
//   const [phone, setPhone] = useState(user?.phone || "");

//   const [addresses, setAddresses] = useState<Address[]>([]);
//   const [loadingAddr, setLoadingAddr] = useState(true);

//   // New address form (minimal)
//   const [newAddr, setNewAddr] = useState({
//     label: "Home",
//     line1: "",
//     line2: "",
//     city: "",
//     state: "",
//     zip_code: "",
//     country: "IN",
//     notes: "",
//   });

//   const canAddMore = addresses.length < 3;
//   const defaultId = useMemo(
//     () => addresses.find((a) => a.is_default)?.id,
//     [addresses],
//   );

//   const load = async () => {
//     try {
//       setLoadingAddr(true);
//       const data = await listAddresses();
//       setAddresses(data);
//     } catch (e: any) {
//       toast({ title: "Failed to load addresses", variant: "destructive" });
//     } finally {
//       setLoadingAddr(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const saveProfile = () => {
//     updateUser({ name, phone });
//     setEditProfile(false);
//     toast({ title: "Profile updated" });
//   };

//   const onAddAddress = async () => {
//     try {
//       if (!canAddMore) return;
//       await createAddress(newAddr);
//       toast({ title: "Address added" });
//       setNewAddr({
//         label: "Home",
//         line1: "",
//         line2: "",
//         city: "",
//         state: "",
//         zip_code: "",
//         country: "IN",
//         notes: "",
//       });
//       await load();

//       // If user came from checkout, route back once they have at least 1 address
//       if (returnTo) navigate(returnTo);
//     } catch (err: any) {
//       toast({
//         title: "Failed to add address",
//         description: err.response?.data
//           ? JSON.stringify(err.response.data)
//           : "Error",
//         variant: "destructive",
//       });
//     }
//   };

//   const onDelete = async (id: string) => {
//     try {
//       await deleteAddress(id);
//       toast({ title: "Address deleted" });
//       await load();
//     } catch {
//       toast({ title: "Failed to delete address", variant: "destructive" });
//     }
//   };

//   const onSetDefault = async (id: string) => {
//     try {
//       await setDefaultAddress(id);
//       toast({ title: "Default address updated" });
//       await load();
//     } catch {
//       toast({ title: "Failed to set default", variant: "destructive" });
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-background">
//       <Header />
//       <main className="pt-[188px] md:pt-[200px] pb-16 px-4">
//         <div className="max-w-2xl mx-auto">
//           <Link
//             to="/"
//             className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
//           </Link>

//           <Card className="shadow-lg border-2">
//             <CardHeader className="text-center border-b">
//               <CardTitle>{user.name}</CardTitle>
//               <CardDescription>{user.email}</CardDescription>
//             </CardHeader>

//             <CardContent className="space-y-6 pt-6">
//               {/* PROFILE */}
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <h3 className="font-semibold text-lg">Profile</h3>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     onClick={() => setEditProfile(!editProfile)}
//                   >
//                     <Edit2 className="h-4 w-4 mr-1" />
//                     {editProfile ? "Cancel" : "Edit"}
//                   </Button>
//                 </div>

//                 <Label>Name</Label>
//                 <Input
//                   value={name}
//                   disabled={!editProfile}
//                   onChange={(e) => setName(e.target.value)}
//                 />

//                 <Label>Phone</Label>
//                 <Input
//                   value={phone}
//                   disabled={!editProfile}
//                   onChange={(e) => setPhone(e.target.value)}
//                 />

//                 {editProfile && (
//                   <Button onClick={saveProfile} className="w-full mt-2">
//                     <Save className="h-4 w-4 mr-2" /> Save Profile
//                   </Button>
//                 )}
//               </div>

//               {/* ADDRESSES */}
//               <div className="space-y-3 border-t pt-4">
//                 <h3 className="font-semibold text-lg flex items-center gap-2">
//                   <MapPin className="h-5 w-5" /> Addresses (max 3)
//                 </h3>

//                 {loadingAddr ? (
//                   <p className="text-sm text-muted-foreground">
//                     Loading addresses…
//                   </p>
//                 ) : (
//                   <div className="space-y-3">
//                     {addresses.length === 0 && (
//                       <p className="text-sm text-muted-foreground">
//                         No address found. Add one to continue checkout faster.
//                       </p>
//                     )}

//                     {addresses.map((a) => (
//                       <div
//                         key={a.id}
//                         className="border rounded p-3 flex gap-3 items-start"
//                       >
//                         <input
//                           type="radio"
//                           name="defaultAddress"
//                           checked={a.id === defaultId}
//                           onChange={() => onSetDefault(a.id)}
//                           className="mt-1"
//                         />
//                         <div className="flex-1">
//                           <p className="font-medium">
//                             {a.label || "Address"}{" "}
//                             {a.is_default ? "(Default)" : ""}
//                           </p>
//                           <p className="text-sm text-muted-foreground">
//                             {a.line1}
//                             {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
//                             - {a.zip_code}
//                           </p>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => onDelete(a.id)}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}

//                     <div className="border rounded p-3 space-y-2">
//                       <div className="flex justify-between items-center">
//                         <p className="font-medium">Add new address</p>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           disabled={!canAddMore}
//                           onClick={onAddAddress}
//                         >
//                           <Plus className="h-4 w-4 mr-1" /> Add
//                         </Button>
//                       </div>

//                       {!canAddMore && (
//                         <p className="text-sm text-muted-foreground">
//                           You already saved 3 addresses. Delete one to add
//                           another.
//                         </p>
//                       )}

//                       <Input
//                         placeholder="Label (Home/Work)"
//                         value={newAddr.label}
//                         onChange={(e) =>
//                           setNewAddr({ ...newAddr, label: e.target.value })
//                         }
//                       />
//                       <Input
//                         placeholder="Address line 1"
//                         value={newAddr.line1}
//                         onChange={(e) =>
//                           setNewAddr({ ...newAddr, line1: e.target.value })
//                         }
//                       />
//                       <Input
//                         placeholder="Address line 2 (optional)"
//                         value={newAddr.line2}
//                         onChange={(e) =>
//                           setNewAddr({ ...newAddr, line2: e.target.value })
//                         }
//                       />
//                       <div className="grid grid-cols-2 gap-2">
//                         <Input
//                           placeholder="City"
//                           value={newAddr.city}
//                           onChange={(e) =>
//                             setNewAddr({ ...newAddr, city: e.target.value })
//                           }
//                         />
//                         <Input
//                           placeholder="State"
//                           value={newAddr.state}
//                           onChange={(e) =>
//                             setNewAddr({ ...newAddr, state: e.target.value })
//                           }
//                         />
//                       </div>
//                       <div className="grid grid-cols-2 gap-2">
//                         <Input
//                           placeholder="Zip"
//                           value={newAddr.zip_code}
//                           onChange={(e) =>
//                             setNewAddr({ ...newAddr, zip_code: e.target.value })
//                           }
//                         />
//                         <Input
//                           placeholder="Country (IN)"
//                           value={newAddr.country}
//                           onChange={(e) =>
//                             setNewAddr({
//                               ...newAddr,
//                               country: e.target.value.toUpperCase(),
//                             })
//                           }
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* QUICK LINKS */}
//               <div className="pt-6 border-t space-y-3">
//                 <Button
//                   variant="outline"
//                   className="w-full justify-start"
//                   onClick={() => navigate("/orders")}
//                 >
//                   <ShoppingBag className="h-5 w-5 mr-3" /> My Orders
//                 </Button>

//                 <Button
//                   variant="outline"
//                   className="w-full justify-start text-destructive"
//                   onClick={handleLogout}
//                 >
//                   <LogOut className="h-5 w-5 mr-3" /> Logout
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default Profile;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Edit2,
  Save,
  ArrowLeft,
  ShoppingBag,
  LogOut,
  MapPin,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  listAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/api/addresses";
import api from "@/lib/axios";

type Address = {
  id: string;
  label?: string;
  full_name?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  notes?: string;
  is_default: boolean;
};

const Profile = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("return");

  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();

  const [editProfile, setEditProfile] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);

  // New address form
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    notes: "",
  });

  const canAddMore = addresses.length < 3;

  // Sorting: Default address always on top
  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) =>
      a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1,
    );
  }, [addresses]);

  const load = async () => {
    try {
      setLoadingAddr(true);
      const data = await listAddresses();
      setAddresses(data);
    } catch (e: any) {
      toast({ title: "Failed to load addresses", variant: "destructive" });
    } finally {
      setLoadingAddr(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // const saveProfile = () => {
  //   updateUser({ name, phone });
  //   setEditProfile(false);
  //   toast({ title: "Profile updated" });
  // };
  const saveProfile = async () => {
    try {
      // 1. Call Backend API
      const res = await api.put("auth/profile/update/", {
        name: name,
        phone: phone,
      });

      // 2. Update Context/Local Storage
      const updatedUser = {
        ...user!,
        name: res.data.full_name, // Map back from backend response
        phone: res.data.phone,
      };

      updateUser(updatedUser); // This function from AuthContext needs to update state & localStorage
      setEditProfile(false);
      toast({ title: "Profile updated successfully" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
    }
  };
  const onAddAddress = async () => {
    try {
      if (!canAddMore) return;
      await createAddress(newAddr);
      toast({ title: "Address added" });
      setNewAddr({
        label: "Home",
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip_code: "",
        country: "IN",
        notes: "",
      });
      await load();

      if (returnTo) navigate(returnTo);
    } catch (err: any) {
      toast({
        title: "Failed to add address",
        description: err.response?.data
          ? JSON.stringify(err.response.data)
          : "Error",
        variant: "destructive",
      });
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      toast({ title: "Address deleted" });
      await load();
    } catch {
      toast({ title: "Failed to delete address", variant: "destructive" });
    }
  };

  const onSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast({ title: "Default address updated" });
      await load();
    } catch {
      toast({ title: "Failed to set default", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[188px] md:pt-[200px] pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <br />
          <Link
            to="/"
            className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>

          <Card className="shadow-lg border-2">
            <CardHeader className="text-center border-b bg-muted/20">
              <CardTitle className="text-2xl">{name || user.email}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
              {/* PROFILE SECTION */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Edit2 className="h-4 w-4" /> Personal Details
                  </h3>
                  <Button
                    size="sm"
                    variant={editProfile ? "secondary" : "outline"}
                    onClick={() => setEditProfile(!editProfile)}
                  >
                    {editProfile ? "Cancel" : "Edit"}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={name}
                      disabled={!editProfile}
                      onChange={(e) => setName(e.target.value)}
                      className={editProfile ? "bg-background" : "bg-muted/50"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={phone}
                      disabled={!editProfile}
                      onChange={(e) => setPhone(e.target.value)}
                      className={editProfile ? "bg-background" : "bg-muted/50"}
                    />
                  </div>
                </div>

                {editProfile && (
                  <Button onClick={saveProfile} className="w-full md:w-auto">
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                )}
              </div>

              {/* ADDRESS SECTION */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Saved Addresses
                  <span className="text-sm font-normal text-muted-foreground ml-auto">
                    {addresses.length}/3 used
                  </span>
                </h3>

                {loadingAddr ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading addresses...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedAddresses.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-2">
                          No addresses saved yet
                        </p>
                      </div>
                    )}

                    {sortedAddresses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => !a.is_default && onSetDefault(a.id)}
                        className={`
                          group relative border-2 rounded-xl p-4 transition-all cursor-pointer
                          ${
                            a.is_default
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 ${a.is_default ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {a.is_default ? (
                              <CheckCircle2 className="h-5 w-5 fill-current" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {a.label || "Address"}
                              </span>
                              {a.is_default && (
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {a.line1}
                              {a.line2 && <>, {a.line2}</>}
                              <br />
                              {a.city}, {a.state} - {a.zip_code}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(a.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* ADD NEW ADDRESS FORM */}
                    <div className="pt-4">
                      {canAddMore ? (
                        <div className="border rounded-xl p-4 space-y-4 bg-muted/10">
                          <h4 className="font-medium flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add New Address
                          </h4>

                          <div className="grid gap-3">
                            <Input
                              placeholder="Label (e.g. Home, Work)"
                              value={newAddr.label}
                              onChange={(e) =>
                                setNewAddr({
                                  ...newAddr,
                                  label: e.target.value,
                                })
                              }
                            />
                            <Input
                              placeholder="Street Address Line 1"
                              value={newAddr.line1}
                              onChange={(e) =>
                                setNewAddr({
                                  ...newAddr,
                                  line1: e.target.value,
                                })
                              }
                            />
                            <Input
                              placeholder="Line 2 (Optional)"
                              value={newAddr.line2}
                              onChange={(e) =>
                                setNewAddr({
                                  ...newAddr,
                                  line2: e.target.value,
                                })
                              }
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="City"
                                value={newAddr.city}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    city: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="State"
                                value={newAddr.state}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    state: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Zip Code"
                                value={newAddr.zip_code}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    zip_code: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="Country"
                                value={newAddr.country}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    country: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button onClick={onAddAddress} className="w-full">
                              Add Address
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center border border-yellow-200">
                          Maximum limit reached (3 addresses). Delete one to add
                          another.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/orders")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" /> Order History
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
